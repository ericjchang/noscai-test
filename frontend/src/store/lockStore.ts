import { create } from 'zustand';
import { AppointmentLockInfo } from '../types';

interface LockState {
  locks: Map<string, AppointmentLockInfo>;
  isAcquiring: boolean;
  error: string | null;

  setLock: (appointmentId: string, lock: AppointmentLockInfo | null) => void;
  updateLockTimer: (appointmentId: string) => void;
  clearLock: (appointmentId: string) => void;
  setAcquiring: (isAcquiring: boolean) => void;
  setError: (error: string | null) => void;

  getLock: (appointmentId: string) => AppointmentLockInfo | null;
  isLocked: (appointmentId: string) => boolean;
  isLockedByCurrentUser: (appointmentId: string, userId: string) => boolean;
}

export const useLockStore = create<LockState>((set, get) => ({
  locks: new Map(),
  isAcquiring: false,
  error: null,

  setLock: (appointmentId: string, lock: AppointmentLockInfo | null) => {
    set(state => {
      const newLocks = new Map(state.locks);
      if (lock) {
        newLocks.set(appointmentId, lock);
      } else {
        newLocks.delete(appointmentId);
      }
      return { locks: newLocks };
    });
  },

  updateLockTimer: (appointmentId: string) => {
    set(state => {
      const lock = state.locks.get(appointmentId);
      if (!lock) return state;

      const timeRemaining = Math.max(0, new Date(lock.expiresAt).getTime() - Date.now());
      if (timeRemaining <= 0) {
        const newLocks = new Map(state.locks);
        newLocks.delete(appointmentId);
        return { locks: newLocks };
      }

      const newLocks = new Map(state.locks);
      newLocks.set(appointmentId, { ...lock, timeRemaining });
      return { locks: newLocks };
    });
  },

  clearLock: (appointmentId: string) => {
    set(state => {
      const newLocks = new Map(state.locks);
      newLocks.delete(appointmentId);
      return { locks: newLocks };
    });
  },

  setAcquiring: (isAcquiring: boolean) => set({ isAcquiring }),
  setError: (error: string | null) => set({ error }),

  getLock: (appointmentId: string) => {
    return get().locks.get(appointmentId) || null;
  },

  isLocked: (appointmentId: string) => {
    const lock = get().locks.get(appointmentId);
    return lock ? new Date(lock.expiresAt).getTime() > Date.now() : false;
  },

  isLockedByCurrentUser: (appointmentId: string, userId: string) => {
    const lock = get().locks.get(appointmentId);
    return lock?.userId === userId && new Date(lock.expiresAt).getTime() > Date.now();
  },
}));
