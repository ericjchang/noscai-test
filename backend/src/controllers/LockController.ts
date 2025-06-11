import { Request, Response } from 'express';
import * as LockService from '../services/LockServices';
import * as WebSocketService from '../services/WebSocketServices';

export const getLockStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const lockInfo = await LockService.getLockInfo(appointmentId);

    res.json({
      success: true,
      lock: lockInfo,
    });
  } catch (err) {
    console.error('Error getting lock status:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get lock status',
    });
  }
};

export const acquireLock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const userId = (req as any).user.userId;

    const result = await LockService.acquireLock(appointmentId, userId);

    if (result.success && result.lock) {
      await WebSocketService.broadcastLockAcquired(appointmentId, result.lock);
    }

    res.json(result);
  } catch (err) {
    console.error('Error acquiring lock:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to acquire lock',
    });
  }
};

export const releaseLock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const userId = (req as any).user.userId;

    const result = await LockService.releaseLock(appointmentId, userId);

    if (result.success) {
      await WebSocketService.broadcastLockReleased(appointmentId, userId);
    }

    res.json(result);
  } catch (err) {
    console.error('Error releasing lock', err);
    res.status(500).json({
      success: false,
      message: 'Failed to release lock',
    });
  }
};

export const forceLock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const adminUserId = (req as any).user.userId;

    const result = await LockService.forceLock(appointmentId, adminUserId);

    if (result.success && result.lock) {
      await WebSocketService.broadcastLockAcquired(appointmentId, result.lock);
    }

    res.json(result);
  } catch (err) {
    console.error('Error forcing lock', err);
    res.status(500).json({
      success: false,
      message: 'Failed to force lock',
    });
  }
};

// admin
export const getAppointmentLocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const locks = await LockService.getAppointmentLocks(appointmentId);

    res.json({
      success: true,
      locks,
    });
  } catch (err) {
    console.error('Error getting appointment locks:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment locks',
    });
  }
};

export const getUserLocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const locks = await LockService.getUserActiveLocks(userId);

    res.json({
      success: true,
      locks,
    });
  } catch (err) {
    console.error('Error getting user locks:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get user locks',
    });
  }
};

export const forceReleaseUserLocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminUserId = (req as any).user.userId;

    const result = await LockService.forceReleaseUserLocks(userId, adminUserId);
    res.json(result);
  } catch (err) {
    console.error('Error force releasing user locks:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to force release user locks',
    });
  }
};

export const getWebSocketStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = WebSocketService.getWebSocketStats();
    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('Error getting WebSocket stats:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get WebSocket stats',
    });
  }
};
