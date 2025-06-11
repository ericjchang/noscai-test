import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import { Appointment, AppointmentFormData } from '../types';

export const useAppointments = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  doctorId?: string;
  patientId?: string;
}) => {
  const queryClient = useQueryClient();

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', params],
    queryFn: () => api.getAppointments(params),
    staleTime: 5 * 60 * 1000,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (data: AppointmentFormData) => api.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppointmentFormData> & { version: number } }) =>
      api.updateAppointment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', variables.id] });
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: string) => api.deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return {
    appointments: appointmentsQuery.data?.data || [],
    pagination: appointmentsQuery.data?.pagination,
    isLoading: appointmentsQuery.isLoading,
    error: appointmentsQuery.error,
    createAppointment: createAppointmentMutation.mutateAsync,
    updateAppointment: updateAppointmentMutation.mutate,
    deleteAppointment: deleteAppointmentMutation.mutate,
    isCreating: createAppointmentMutation.isPending,
    isUpdating: updateAppointmentMutation.isPending,
    isDeleting: deleteAppointmentMutation.isPending,
    refetch: appointmentsQuery.refetch,
  };
};

export const useAppointment = (id: string) => {
  const queryClient = useQueryClient();

  const appointmentQuery = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => api.getAppointment(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  return {
    appointment: appointmentQuery.data?.appointment,
    lock: appointmentQuery.data?.lock,
    isLoading: appointmentQuery.isLoading,
    error: appointmentQuery.error,
    refetch: appointmentQuery.refetch,
  };
};
