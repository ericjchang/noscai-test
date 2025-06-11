import React from 'react';
import { motion } from 'framer-motion';
import { LockClosedIcon, ClockIcon, UserIcon } from '@heroicons/react/24/solid';
import { AppointmentLockInfo } from '../../types';
import { formatTimeRemaining } from '../../utils/helpers';

interface LockIndicatorProps {
  lock: AppointmentLockInfo | null;
  isOwnedByCurrentUser: boolean;
  className?: string;
}

const LockIndicator: React.FC<LockIndicatorProps> = ({ lock, isOwnedByCurrentUser, className = '' }) => {
  if (!lock) return null;

  const timeRemaining = formatTimeRemaining(lock.timeRemaining);
  const isExpiringSoon = lock.timeRemaining < 60000; // Less than 1 minute

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`flex items-center space-x-2 ${className}`}
    >
      <div
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
          isOwnedByCurrentUser
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}
      >
        <LockClosedIcon className='w-4 h-4' />
        <div className='flex items-center space-x-1'>
          <UserIcon className='w-4 h-4' />
          <span className='text-sm font-medium'>{isOwnedByCurrentUser ? 'You' : lock.userInfo.name}</span>
        </div>
        <div className='flex items-center space-x-1'>
          <ClockIcon className={`w-4 h-4 ${isExpiringSoon ? 'text-red-500 animate-pulse' : ''}`} />
          <span className={`text-sm ${isExpiringSoon ? 'text-red-500 font-bold' : ''}`}>{timeRemaining}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default LockIndicator;
