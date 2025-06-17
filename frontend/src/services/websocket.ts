import { io, Socket } from 'socket.io-client';
import { config } from '../config/env';
import { WebSocketMessage, PointerPosition } from '../types';

export type WebSocketEventHandler = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(config.wsUrl, {
          auth: { token },
          transports: ['websocket'],
          upgrade: false,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', reason => {
          console.log('WebSocket disconnected:', reason);
          if (reason === 'io server disconnect') {
            return;
          }
          this.handleReconnect();
        });

        this.socket.on('connect_error', error => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });

        this.setupEventListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('lock_event', (message: WebSocketMessage) => {
      this.emit('lock_event', message);
    });

    this.socket.on('lock_status', (lockInfo: any) => {
      this.emit('lock_status', lockInfo);
    });

    this.socket.on('pointer_update', (position: PointerPosition) => {
      this.emit('pointer_update', position);
    });

    this.socket.on('appointment_event', (message: WebSocketMessage) => {
      this.emit('appointment_event', message);
    });
  }

  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }

  joinAppointment(appointmentId: string): void {
    if (this.socket) {
      this.socket.emit('join_appointment', appointmentId);
    }
  }

  leaveAppointment(appointmentId: string): void {
    if (this.socket) {
      this.socket.emit('leave_appointment', appointmentId);
    }
  }

  sendLockHeartbeat(appointmentId: string): void {
    if (this.socket) {
      this.socket.emit('lock_heartbeat', appointmentId);
    }
  }

  updatePointerPosition(appointmentId: string, position: { x: number; y: number }): void {
    if (this.socket) {
      this.socket.emit('pointer_updates', { appointmentId, position });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const webSocketService = new WebSocketService();
