import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { WebSocketMessage } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { webSocketService } from '../services/websocket';

export const useAppointmentSync = (appointmentId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!appointmentId) return;

    const handleAppointmentEvent = (message: WebSocketMessage) => {
      if (message.appointmentId !== appointmentId) return;

      if (message.userId !== user?.userId) {
        queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }
    };

    webSocketService.on('appointment_event', handleAppointmentEvent);

    return () => {
      webSocketService.off('appointment_event', handleAppointmentEvent);
    };
  }, [appointmentId, user?.userId, queryClient]);
};
