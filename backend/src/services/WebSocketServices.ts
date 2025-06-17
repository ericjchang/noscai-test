import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import * as LockService from './LockServices';
import { WebSocketMessage, PointerPosition } from '../types';

const userSockets = new Map<string, Set<Socket>>();
const appointmentRooms = new Map<string, Set<string>>();
let ioInstance: Server | null = null;

export const initWebSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance = io;
  setupAuthentication(io);
  setupConnectionHandling(io);
  return io;
};

// middleware
const setupAuthentication = (io: Server): void => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.data.userId = decoded.userId;
      socket.data.userInfo = {
        name: decoded.name || decoded.userInfo?.name || 'Unknown User',
        email: decoded.email || decoded.userInfo?.email || 'unknown@example.com',
      };

      next();
    } catch (err) {
      console.error('WebSocket authentication error:', err);
      next(new Error('Invalid authentication token'));
    }
  });
};

const setupConnectionHandling = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User ${userId} connected via WebSocket`);

    // track user socket
    addUserSocket(userId, socket);

    socket.on('join_appointment', async (appointmentId: string) => {
      await handleJoinAppointment(socket, appointmentId, userId);
    });

    socket.on('leave_appointment', (appointmentId: string) => {
      handleLeaveAppointment(socket, appointmentId, userId);
    });

    socket.on('pointer_updates', async (data: { appointmentId: string; position: { x: number; y: number } }) => {
      await handlePointerUpdate(socket, data, userId);
    });

    // heartbeat for lock extension
    socket.on('lock_heartbeat', async (appointmentId: string) => {
      await LockService.extendLock(appointmentId, userId);
    });

    socket.on('disconnect', async () => {
      await handleDisconnection(socket, userId);
    });
  });
};

// helper
const addUserSocket = (userId: string, socket: Socket): void => {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socket);
};

const removeUserSocket = (userId: string, socket: Socket): void => {
  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.delete(socket);
    if (userSocketSet.size === 0) {
      userSockets.delete(userId);
    }
  }
};

const addUserToRoom = (appointmentId: string, userId: string): void => {
  if (!appointmentRooms.has(appointmentId)) {
    appointmentRooms.set(appointmentId, new Set());
  }
  appointmentRooms.get(appointmentId)!.add(userId);
};

const removeUserFromRoom = (appointmentId: string, userId: string): void => {
  const room = appointmentRooms.get(appointmentId);
  if (room) {
    room.delete(userId);
    if (room.size === 0) {
      appointmentRooms.delete(appointmentId);
    }
  }
};

// event handlers
const handleJoinAppointment = async (socket: Socket, appointmentId: string, userId: string): Promise<void> => {
  socket.join(appointmentId);
  addUserToRoom(appointmentId, userId);

  const lockInfo = await LockService.getLockInfo(appointmentId);
  socket.emit('lock_status', lockInfo);
};

const handleLeaveAppointment = (socket: Socket, appointmentId: string, userId: string): void => {
  socket.leave(appointmentId);
  removeUserFromRoom(appointmentId, userId);
};

const handlePointerUpdate = async (
  socket: Socket,
  data: { appointmentId: string; position: { x: number; y: number } },
  userId: string
): Promise<void> => {
  const { appointmentId, position } = data;

  await LockService.updatePointerPositing(appointmentId, userId, position);

  if (!socket.data.userInfo) {
    console.error('handlePointerUpdate: socket.data.userInfo is undefined for user', userId);
    return;
  }

  const pointerUpdate = {
    userId,
    appointmentId,
    x: position.x,
    y: position.y,
    userInfo: socket.data.userInfo,
  };

  socket.to(appointmentId).emit('pointer_update', pointerUpdate);
};

const handleDisconnection = async (socket: Socket, userId: string): Promise<void> => {
  console.log(`User ${userId} disconnected`);

  removeUserSocket(userId, socket);

  for (const [appointmentId, userSet] of appointmentRooms.entries()) {
    if (userSet.has(userId)) {
      removeUserFromRoom(appointmentId, userId);
    }
  }
};

export const broadcastLockAcquired = async (appointmentId: string, lockInfo: any): Promise<void> => {
  if (!ioInstance) return;

  const message: WebSocketMessage = {
    type: 'lock_acquired',
    appointmentId,
    userId: lockInfo.userId,
    data: lockInfo,
  };

  ioInstance.to(appointmentId).emit('lock_event', message);
};

export const broadcastLockReleased = async (appointmentId: string, userId: string): Promise<void> => {
  if (!ioInstance) return;

  const message: WebSocketMessage = {
    type: 'lock_released',
    appointmentId,
    userId,
    data: null,
  };

  ioInstance.to(appointmentId).emit('lock_event', message);
};

export const broadcastLockExpired = async (appointmentId: string, userId: string): Promise<void> => {
  if (!ioInstance) return;

  const message: WebSocketMessage = {
    type: 'lock_expired',
    appointmentId,
    userId,
    data: null,
  };

  ioInstance.to(appointmentId).emit('lock_event', message);
};

// utils
export const getConnectedUsers = (): string[] => {
  return Array.from(userSockets.keys());
};

export const getUserSocketCount = (userId: string): number => {
  return userSockets.get(userId)?.size || 0;
};

export const getAppointmentUsers = (appointmentId: string): string[] => {
  return Array.from(appointmentRooms.get(appointmentId) || []);
};

export const isUserConnected = (userId: string): boolean => {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
};

// admin
export const broadcastToUser = async (userId: string, event: string, data: any): Promise<boolean> => {
  if (!ioInstance) return false;

  const userSocketSet = userSockets.get(userId);

  if (!userSocketSet || userSocketSet.size === 0) {
    return false;
  }

  userSocketSet.forEach(socket => {
    socket.emit(event, data);
  });

  return true;
};

export const broadcastToAppointment = async (appointmentId: string, event: string, data: any): Promise<void> => {
  if (!ioInstance) return;

  ioInstance.to(appointmentId).emit(event, data);
};

export const broadcastAppointmentUpdate = async (
  appointmentId: string,
  updatedBy: string,
  appoinmentData: any
): Promise<void> => {
  if (!ioInstance) return;

  const message: WebSocketMessage = {
    type: 'appointment_event',
    appointmentId,
    userId: updatedBy,
    data: appoinmentData,
  };

  ioInstance.to(appointmentId).emit('appointment_event', message);
};

export const disconnectUser = async (userId: string, reason?: string): Promise<void> => {
  if (!ioInstance) return;

  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.forEach(socket => {
      socket.disconnect();
    });
  }
};

// cleanup
export const cleanup = (): void => {
  if (ioInstance) {
    ioInstance.close();
    ioInstance = null;
  }

  userSockets.clear();
  appointmentRooms.clear();
};

export const getWebSocketStats = () => {
  return {
    connectedUsers: userSockets.size,
    totalConnections: Array.from(userSockets.values()).reduce((total, sockets) => total + sockets.size, 0),
    activeAppointments: appointmentRooms.size,
    appointmentParticipants: Array.from(appointmentRooms.values()).reduce((total, users) => total + users.size, 0),
  };
};
