export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  patientId: string;
  patient: User;
  doctorId: string;
  doctor: User;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentLockInfo {
  appointmentId: string;
  userId: string;
  userInfo: {
    name: string;
    email: string;
    position?: { x: number; y: number };
  };
  expiresAt: string;
  timeRemaining: number;
}

export interface LockResponse {
  success: boolean;
  lock?: AppointmentLockInfo | null;
  message?: string;
}

export interface WebSocketMessage {
  type: 'lock_acquired' | 'lock_released' | 'pointer_update' | 'lock_expired';
  appointmentId: string;
  userId?: string;
  data?: any;
}

export interface PointerPosition {
  x: number;
  y: number;
  userId: string;
  appointmentId: string;
  userInfo: {
    name: string;
    email: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AppointmentFormData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status?: AppointmentStatus;
  patientId: string;
  doctorId: string;
}
