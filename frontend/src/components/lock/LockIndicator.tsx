import React, { useState, useEffect } from 'react';
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
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!lock) {
      setTimeRemaining(0);
      return;
    }

    const updateTimeRemaining = () => {
      const remaining = Math.max(0, new Date(lock.expiresAt).getTime() - Date.now());
      setTimeRemaining(remaining);
      return remaining;
    };

    updateTimeRemaining();

    const interval = setInterval(() => {
      const remaining = updateTimeRemaining();

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lock]);

  if (!lock) return null;

  const formattedTime = formatTimeRemaining(timeRemaining);
  const isExpiringSoon = timeRemaining < 60000;
  const isExpired = timeRemaining <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`flex items-center space-x-2 ${className}`}
    >
      <div
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
          isExpired
            ? 'bg-red-100 text-red-800 border border-red-200'
            : isOwnedByCurrentUser
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}
      >
        <LockClosedIcon className={`w-4 h-4 ${isExpired ? 'text-red-500' : ''}`} />
        <div className='flex items-center space-x-1'>
          <UserIcon className='w-4 h-4' />
          <span className='text-sm font-medium'>{isOwnedByCurrentUser ? 'You' : lock.userInfo.name}</span>
        </div>
        <div className='flex items-center space-x-1'>
          <ClockIcon
            className={`w-4 h-4 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-red-500 animate-pulse' : ''}`}
          />
          <span
            className={`text-sm font-mono ${
              isExpired ? 'text-red-500 font-bold' : isExpiringSoon ? 'text-red-500 font-bold animate-pulse' : ''
            }`}
          >
            {formattedTime}
          </span>
        </div>
        {isExpired && <span className='text-xs font-semibold text-red-600 bg-red-200 px-2 py-1 rounded'>EXPIRED</span>}
      </div>
    </motion.div>
  );
};

export default LockIndicator;
