import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import {
  Appointment,
  AppointmentFormData,
  AppointmentLockInfo,
  LockResponse,
  User,
  LoginCredentials,
  AuthUser,
  PaginatedResponse,
  ApiResponse,
} from '../types';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: config.apiUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    config => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );

  client.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

export const login = async (credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('authToken');
};

export const getProfile = async (): Promise<AuthUser> => {
  const response = await apiClient.get('/auth/profile');
  return response.data.user;
};

export const getAppointments = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  doctorId?: string;
  patientId?: string;
}): Promise<PaginatedResponse<Appointment>> => {
  const response = await apiClient.get('/appointments', { params });
  return response.data;
};

export const getAppointment = async (id: string): Promise<{ appointment: Appointment; lock?: AppointmentLockInfo }> => {
  const response = await apiClient.get(`/appointments/${id}`);
  return response.data;
};

export const createAppointment = async (data: AppointmentFormData): Promise<Appointment> => {
  const response = await apiClient.post('/appointments', data);
  return response.data.appointment;
};

export const updateAppointment = async (
  id: string,
  data: Partial<AppointmentFormData> & { version: number }
): Promise<Appointment> => {
  const response = await apiClient.put(`/appointments/${id}`, data);
  return response.data.appointment;
};

export const deleteAppointment = async (id: string): Promise<void> => {
  await apiClient.delete(`/appointments/${id}`);
};

// Lock
export const getLockStatus = async (appointmentId: string): Promise<LockResponse> => {
  const response = await apiClient.get(`/appointments/${appointmentId}/lock-status`);
  return response.data;
};

export const acquireLock = async (appointmentId: string): Promise<LockResponse> => {
  const response = await apiClient.post(`/appointments/${appointmentId}/acquire-lock`);
  return response.data;
};

export const releaseLock = async (appointmentId: string): Promise<LockResponse> => {
  const response = await apiClient.delete(`/appointments/${appointmentId}/release-lock`);
  return response.data;
};

export const forceLock = async (appointmentId: string): Promise<LockResponse> => {
  const response = await apiClient.post(`/appointments/${appointmentId}/force-lock`);
  return response.data;
};

// Admin
export const getAppointmentLocks = async (appointmentId: string): Promise<any[]> => {
  const response = await apiClient.get(`/appointments/${appointmentId}/locks`);
  return response.data.locks;
};

export const getUserLocks = async (userId: string): Promise<any[]> => {
  const response = await apiClient.get(`/appointments/users/${userId}/locks`);
  return response.data.locks;
};

export const forceReleaseUserLocks = async (userId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete(`/appointments/users/${userId}/locks`);
  return response.data;
};

export const getWebSocketStats = async (): Promise<any> => {
  const response = await apiClient.get('/appointments/stats/websocket');
  return response.data.stats;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get('/users');
  return response.data.users;
};

export const apiService = {
  login,
  logout,
  getProfile,
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getLockStatus,
  acquireLock,
  releaseLock,
  forceLock,
  getAppointmentLocks,
  getUserLocks,
  forceReleaseUserLocks,
  getWebSocketStats,
  getUsers,
};
