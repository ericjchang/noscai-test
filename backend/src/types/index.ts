export interface LockRequest {
  appointmentId: string;
  userId: string;
}

export interface LockResponse {
  success: boolean;
  lock?: AppointmentLockInfo | null;
  message?: string;
}

export interface AppointmentLockInfo {
  appointmentId: string;
  userId: string;
  userInfo: {
    name: string;
    email: string;
    position?: { x: number; y: number };
  };
  expiresAt: Date;
  timeRemaining: number;
}

export interface WebSocketMessage {
  type: 'lock_acquired' | 'lock_released' | 'pointer_update' | 'lock_expired' | 'appointment_event';
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
