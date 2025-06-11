import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import { webSocketService } from '../services/websocket';
import { useLockStore } from '../store/lockStore';
import { useAuth } from './useAuth';
import { WebSocketMessage } from '../types';

export const useLock = (appointmentId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  const {
    locks,
    isAcquiring,
    error,
    setLock,
    updateLockTimer,
    clearLock,
    setAcquiring,
    setError,
    getLock,
    isLocked,
    isLockedByCurrentUser,
  } = useLockStore();

  const currentLock = getLock(appointmentId);
  const locked = isLocked(appointmentId);
  const ownedByCurrentUser = user ? isLockedByCurrentUser(appointmentId, user.userId) : false;

  const { data: lockStatus } = useQuery({
    queryKey: ['lock-status', appointmentId],
    queryFn: () => api.getLockStatus(appointmentId),
    refetchInterval: 30000,
    enabled: !!appointmentId,
  });

  useEffect(() => {
    if (lockStatus?.lock) {
      setLock(appointmentId, lockStatus.lock);
    } else if (lockStatus?.success && !lockStatus.lock) {
      clearLock(appointmentId);
    }
  }, [lockStatus, appointmentId, setLock, clearLock]);

  const acquireLockMutation = useMutation({
    mutationFn: () => api.acquireLock(appointmentId),
    onMutate: () => {
      setAcquiring(true);
      setError(null);
    },
    onSuccess: response => {
      if (response.success && response.lock) {
        setLock(appointmentId, response.lock);
        startHeartbeat();
      } else {
        setError(response.message || 'Failed to acquire lock');
      }
      setAcquiring(false);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to acquire lock');
      setAcquiring(false);
    },
  });

  const releaseLockMutation = useMutation({
    mutationFn: () => api.releaseLock(appointmentId),
    onSuccess: () => {
      clearLock(appointmentId);
      stopHeartbeat();
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to release lock');
    },
  });

  const forceLockMutation = useMutation({
    mutationFn: () => api.forceLock(appointmentId),
    onSuccess: response => {
      if (response.success && response.lock) {
        setLock(appointmentId, response.lock);
        startHeartbeat();
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to force lock');
    },
  });

  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) return;

    heartbeatInterval.current = setInterval(() => {
      if (ownedByCurrentUser) {
        webSocketService.sendLockHeartbeat(appointmentId);
        updateLockTimer(appointmentId);
      } else {
        stopHeartbeat();
      }
    }, 30000); // Send heartbeat every 30 seconds
  }, [appointmentId, ownedByCurrentUser, updateLockTimer]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  useEffect(() => {
    const handleLockEvent = (message: WebSocketMessage) => {
      if (message.appointmentId !== appointmentId) return;

      switch (message.type) {
        case 'lock_acquired':
          if (message.data) {
            setLock(appointmentId, message.data);
          }
          break;
        case 'lock_released':
        case 'lock_expired':
          clearLock(appointmentId);
          stopHeartbeat();
          break;
      }
    };

    const handleLockStatus = (lockInfo: any) => {
      if (lockInfo) {
        setLock(appointmentId, lockInfo);
      } else {
        clearLock(appointmentId);
      }
    };

    webSocketService.on('lock_event', handleLockEvent);
    webSocketService.on('lock_status', handleLockStatus);

    return () => {
      webSocketService.off('lock_event', handleLockEvent);
      webSocketService.off('lock_status', handleLockStatus);
    };
  }, [appointmentId, setLock, clearLock, stopHeartbeat]);

  useEffect(() => {
    if (appointmentId && webSocketService.isConnected()) {
      webSocketService.joinAppointment(appointmentId);
    }

    return () => {
      if (appointmentId && webSocketService.isConnected()) {
        webSocketService.leaveAppointment(appointmentId);
      }
      stopHeartbeat();
    };
  }, [appointmentId, stopHeartbeat]);

  useEffect(() => {
    if (ownedByCurrentUser) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }
  }, [ownedByCurrentUser, startHeartbeat, stopHeartbeat]);

  return {
    currentLock,
    locked,
    ownedByCurrentUser,
    isAcquiring,
    error,
    acquireLock: acquireLockMutation.mutate,
    releaseLock: releaseLockMutation.mutate,
    forceLock: forceLockMutation.mutate,
    clearError: () => setError(null),
    isAcquiringLock: acquireLockMutation.isPending,
    isReleasingLock: releaseLockMutation.isPending,
    isForcingLock: forceLockMutation.isPending,
  };
};
