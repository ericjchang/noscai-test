import React from 'react';
import { AnimatePresence } from 'framer-motion';
import FollowingPointer from './FollowingPointer';
import { usePointer } from '../../hooks/usePointer';
import { useAuth } from '../../hooks/useAuth';

interface CollaborativeCursorsProps {
  appointmentId: string;
  isEnabled?: boolean;
}

const CURSOR_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({ appointmentId, isEnabled = true }) => {
  const { user } = useAuth();
  const { appointmentPointers } = usePointer(appointmentId, isEnabled);

  const otherPointers = appointmentPointers.filter(pointer => pointer.userId !== user?.userId);

  const getUserColor = (userId: string): string => {
    const hash = userId.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
  };

  if (!isEnabled) return null;

  return (
    <AnimatePresence>
      {otherPointers.map(pointer => (
        <FollowingPointer
          key={pointer.userId}
          x={pointer.x}
          y={pointer.y}
          userInfo={pointer.userInfo}
          color={getUserColor(pointer.userId)}
        />
      ))}
    </AnimatePresence>
  );
};

export default CollaborativeCursors;
