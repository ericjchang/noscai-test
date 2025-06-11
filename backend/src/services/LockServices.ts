import { Repository, MoreThan } from 'typeorm';
import { AppDataSource } from '../utils/database';
import { AppointmentLock } from '../models/AppointmentLock';
import { User } from '../models/User';
import { LockResponse, AppointmentLockInfo } from '../types';
import { validate as isUUID } from 'uuid';

const LOCK_EXPIRY_MINUTES = process.env.LOCK_EXPIRY_MINUTES;
const cleanupInterval = parseInt(LOCK_EXPIRY_MINUTES || '5') * 6000;

let lockCleanupInterval: NodeJS.Timeout | null = null;

const getLockRepo = (): Repository<AppointmentLock> => AppDataSource.getRepository(AppointmentLock);
const getUserRepo = (): Repository<User> => AppDataSource.getRepository(User);

export const extendLock = async (appointmentId: string, userId: string): Promise<void> => {
  if (!isUUID(appointmentId)) {
    return;
  }

  const lockRepo = getLockRepo();
  await lockRepo.update(
    { appointmentId, userId },
    {
      expiresAt: new Date(Date.now() + parseInt(LOCK_EXPIRY_MINUTES || '5') * 60 * 1000),
      lastActivity: new Date(),
    }
  );
};

export const getLockInfo = async (appointmentId: string): Promise<AppointmentLockInfo | null> => {
  if (!isUUID(appointmentId)) {
    return null;
  }

  const lockRepo = getLockRepo();
  const lock = await lockRepo.findOne({
    where: { appointmentId },
    relations: ['user'],
  });

  if (!lock || lock.expiresAt <= new Date()) {
    return null;
  }

  return {
    appointmentId: lock.appointmentId,
    userId: lock.userId,
    userInfo: lock.userInfo,
    expiresAt: lock.expiresAt,
    timeRemaining: Math.max(0, lock.expiresAt.getTime() - Date.now()),
  };
};

export const acquireLock = async (appointmentId: string, userId: string): Promise<LockResponse> => {
  if (!isUUID(appointmentId)) {
    return {
      success: false,
      message: 'Invalid appointment ID format',
    };
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const existingLock = await queryRunner.manager.findOne(AppointmentLock, {
      where: { appointmentId },
      relations: ['user'],
    });

    if (existingLock) {
      if (existingLock.expiresAt > new Date()) {
        if (existingLock.userId === userId) {
          await extendLock(appointmentId, userId);
          await queryRunner.commitTransaction();
          return {
            success: true,
            lock: await getLockInfo(appointmentId),
          };
        } else {
          await queryRunner.rollbackTransaction();
          return {
            success: false,
            message: `Appointment is currently being edited by ${existingLock.user.name}`,
          };
        }
      } else {
        // Lock is expired, remove it
        await queryRunner.manager.remove(existingLock);
      }
    }

    const user = await getUserRepo().findOne({ where: { id: userId } });
    if (!user) {
      await queryRunner.rollbackTransaction();
      return {
        success: false,
        message: 'User not found',
      };
    }

    const lockRepo = getLockRepo();
    const newLock = lockRepo.create({
      appointmentId,
      userId,
      userInfo: {
        name: user.name,
        email: user.email,
      },
      expiresAt: new Date(Date.now() + parseInt(LOCK_EXPIRY_MINUTES || '5') * 60 * 1000),
      lastActivity: new Date(),
    });

    await queryRunner.manager.save(newLock);
    await queryRunner.commitTransaction();

    return {
      success: true,
      lock: await getLockInfo(appointmentId),
    };
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Error acquiring lock:', err);
    return {
      success: false,
      message: 'Failed to acquire lock',
    };
  } finally {
    await queryRunner.release();
  }
};

export const releaseLock = async (appointmentId: string, userId: string): Promise<LockResponse> => {
  if (!isUUID(appointmentId)) {
    return { success: true };
  }

  try {
    const lockRepo = getLockRepo();
    const lock = await lockRepo.findOne({
      where: { appointmentId, userId },
    });

    if (!lock) {
      return { success: false, message: 'Lock not found or not owned by user' };
    }

    await lockRepo.remove(lock);
    return { success: true };
  } catch (err) {
    console.error('Error releasing lock:', err);
    return {
      success: false,
      message: 'Failed to release lock',
    };
  }
};

export const forceLock = async (appointmentId: string, adminUserId: string): Promise<LockResponse> => {
  if (!isUUID(appointmentId)) {
    return {
      success: false,
      message: 'Invalid appointment ID format',
    };
  }

  const userRepo = getUserRepo();
  const admin = await userRepo.findOne({ where: { id: adminUserId } });

  if (!admin || admin.role !== 'admin') {
    return {
      success: false,
      message: 'Admin permission required',
    };
  }

  const lockRepo = getLockRepo();
  await lockRepo.delete({ appointmentId });

  return acquireLock(appointmentId, adminUserId);
};

export const updatePointerPositing = async (
  appointmentId: string,
  userId: string,
  position: { x: number; y: number }
): Promise<void> => {
  if (!isUUID(appointmentId)) {
    return;
  }

  try {
    const lockRepo = getLockRepo();
    await lockRepo
      .createQueryBuilder()
      .update()
      .set({
        userInfo: () => `jsonb_set(userInfo, '{position}', '${JSON.stringify(position)}'::jsonb)`,
      })
      .where({ appointmentId, userId })
      .execute();
  } catch (error) {
    console.error('Error updating pointer position:', error);
  }
};

export const startLockCleanup = (): void => {
  lockCleanupInterval = setInterval(async () => {
    try {
      const lockRepo = getLockRepo();
      const expiredLock = await lockRepo.find({
        where: { expiresAt: new Date() },
      });

      if (expiredLock.length > 0) {
        await lockRepo.remove(expiredLock);
        console.log(`Cleaned up ${expiredLock.length} expired locks`);
      }
    } catch (err) {
      console.error('Error cleaning up expired locks:', err);
    }
  }, cleanupInterval);
};

export const stopLockCleanup = (): void => {
  if (lockCleanupInterval) {
    clearInterval(lockCleanupInterval);
    lockCleanupInterval = null;
  }
};

export const getAppointmentLocks = async (appointmentId: string): Promise<AppointmentLock[]> => {
  const lockRepo = getLockRepo();
  return lockRepo.find({
    where: { appointmentId },
    relations: ['user'],
  });
};

export const getUserActiveLocks = async (userId: string): Promise<AppointmentLock[]> => {
  const lockRepo = getLockRepo();
  return lockRepo.find({
    where: { userId, expiresAt: MoreThan(new Date()) },
    relations: ['user'],
  });
};

export const forceReleaseUserLocks = async (userId: string, adminUserId: string): Promise<LockResponse> => {
  const userRepo = getUserRepo();
  const admin = await userRepo.findOne({ where: { id: adminUserId } });

  if (!admin || admin.role !== 'admin') {
    return {
      success: false,
      message: 'Admin permission required',
    };
  }

  try {
    const lockRepo = getLockRepo();
    const userLocks = await getUserActiveLocks(userId);

    if (userLocks.length > 0) {
      await lockRepo.remove(userLocks);
      return {
        success: true,
        message: `Released ${userLocks.length} locks for user`,
      };
    }

    return {
      success: true,
      message: 'No Active locks found for user',
    };
  } catch (err) {
    console.error('Error force releasing user locks:', err);
    return {
      success: false,
      message: 'Failed to release user locks',
    };
  }
};
