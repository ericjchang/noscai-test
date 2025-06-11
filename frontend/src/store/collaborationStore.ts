import { create } from 'zustand';
import { PointerPosition } from '../types';

interface CollaborationState {
  pointers: Map<string, PointerPosition>;
  connectedUsers: Map<string, { name: string; email: string; lastSeen: number }>;

  updatePointer: (position: PointerPosition) => void;
  removePointer: (userId: string) => void;
  addConnectedUser: (userId: string, userInfo: { name: string; email: string }) => void;
  removeConnectedUser: (userId: string) => void;
  cleanup: () => void;

  getPointers: (appointmentId: string) => PointerPosition[];
  getConnectedUsersCount: () => number;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  pointers: new Map(),
  connectedUsers: new Map(),

  updatePointer: (position: PointerPosition) => {
    set(state => {
      const newPointers = new Map(state.pointers);
      newPointers.set(position.userId, position);
      return { pointers: newPointers };
    });
  },

  removePointer: (userId: string) => {
    set(state => {
      const newPointers = new Map(state.pointers);
      newPointers.delete(userId);
      return { pointers: newPointers };
    });
  },

  addConnectedUser: (userId: string, userInfo: { name: string; email: string }) => {
    set(state => {
      const newConnectedUsers = new Map(state.connectedUsers);
      newConnectedUsers.set(userId, { ...userInfo, lastSeen: Date.now() });
      return { connectedUsers: newConnectedUsers };
    });
  },

  removeConnectedUser: (userId: string) => {
    set(state => {
      const newConnectedUsers = new Map(state.connectedUsers);
      newConnectedUsers.delete(userId);

      const newPointers = new Map(state.pointers);
      newPointers.delete(userId);

      return {
        connectedUsers: newConnectedUsers,
        pointers: newPointers,
      };
    });
  },

  cleanup: () => {
    set({ pointers: new Map(), connectedUsers: new Map() });
  },

  getPointers: (appointmentId: string) => {
    const pointers = get().pointers;
    return Array.from(pointers.values()).filter(pointer => pointer.appointmentId === appointmentId);
  },

  getConnectedUsersCount: () => {
    return get().connectedUsers.size;
  },
}));
