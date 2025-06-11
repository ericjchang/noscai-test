import { useCallback, useEffect, useRef } from 'react';
import { webSocketService } from '../services/websocket';
import { useCollaborationStore } from '../store/collaborationStore';
import { PointerPosition } from '../types';

export const usePointer = (appointmentId: string, isEnabled: boolean = true) => {
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  const { pointers, updatePointer, removePointer, getPointers } = useCollaborationStore();

  const appointmentPointers = getPointers(appointmentId);

  const updatePointerPosition = useCallback(
    (x: number, y: number) => {
      if (!isEnabled || !webSocketService.isConnected()) return;

      const position = { x, y };
      lastPositionRef.current = position;

      if (throttleRef.current) return;

      throttleRef.current = setTimeout(() => {
        if (lastPositionRef.current) {
          webSocketService.updatePointerPosition(appointmentId, lastPositionRef.current);
        }
        throttleRef.current = null;
      }, 100);
    },
    [appointmentId, isEnabled]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const rect = document.documentElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      updatePointerPosition(x, y);
    },
    [updatePointerPosition]
  );

  useEffect(() => {
    if (!isEnabled) return;

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [handleMouseMove, isEnabled]);

  useEffect(() => {
    const handlePointerUpdate = (position: any) => {
      try {
        if (!position || typeof position !== 'object') {
          return;
        }

        if (!position.userId || position.appointmentId !== appointmentId) {
          return;
        }

        if (!position.userInfo || !position.userInfo.name) {
          return;
        }

        const validatedPosition: PointerPosition = {
          x: position.x || 0,
          y: position.y || 0,
          userId: position.userId,
          appointmentId: position.appointmentId,
          userInfo: {
            name: position.userInfo.name || 'Unknown User',
            email: position.userInfo.email || 'unknown@example.com',
          },
        };

        updatePointer(validatedPosition);
      } catch (error) {
        console.error('Error handling pointer update:', error, position);
      }
    };

    webSocketService.on('pointer_update', handlePointerUpdate);

    return () => {
      webSocketService.off('pointer_update', handlePointerUpdate);
    };
  }, [appointmentId, updatePointer]);

  return {
    appointmentPointers,
    updatePointerPosition,
  };
};
