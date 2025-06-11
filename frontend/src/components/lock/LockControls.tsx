import React from 'react';
import { motion } from 'framer-motion';
import { LockOpenIcon, LockClosedIcon, ExclamationTriangleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useLock } from '../../hooks/useLock';
import { useAuth } from '../../hooks/useAuth';
import { AppointmentLockInfo } from '../../types';

interface LockControlsProps {
  appointmentId: string;
  onEditStart?: () => void;
  disabled?: boolean;
}

const LockControls: React.FC<LockControlsProps> = ({ appointmentId, onEditStart, disabled = false }) => {
  const { user, isAdmin } = useAuth();
  const {
    currentLock,
    locked,
    ownedByCurrentUser,
    isAcquiring,
    error,
    acquireLock,
    releaseLock,
    forceLock,
    clearError,
    isAcquiringLock,
    isReleasingLock,
    isForcingLock,
  } = useLock(appointmentId);

  const handleAcquireLock = async () => {
    clearError();
    try {
      await acquireLock();
      onEditStart?.();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleReleaseLock = async () => {
    clearError();
    try {
      await releaseLock();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleForceLock = async () => {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      `Are you sure you want to force take control? This will remove the lock from ${currentLock?.userInfo.name}.`
    );

    if (confirmed) {
      clearError();
      try {
        await forceLock();
        onEditStart?.();
      } catch (error) {
        // Error is handled by the hook
      }
    }
  };

  const isLoading = isAcquiringLock || isReleasingLock || isForcingLock;

  return (
    <div className='space-y-3'>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2'
        >
          <ExclamationTriangleIcon className='w-5 h-5 mt-0.5 flex-shrink-0' />
          <div>
            <p className='text-sm font-medium'>Error</p>
            <p className='text-sm'>{error}</p>
          </div>
        </motion.div>
      )}

      <div className='flex items-center space-x-3'>
        {!locked && (
          <button
            onClick={handleAcquireLock}
            disabled={disabled || isLoading}
            className='btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isAcquiringLock ? (
              <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
            ) : (
              <PencilIcon className='w-4 h-4' />
            )}
            <span>Start Editing</span>
          </button>
        )}

        {locked && ownedByCurrentUser && (
          <button
            onClick={handleReleaseLock}
            disabled={disabled || isLoading}
            className='btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isReleasingLock ? (
              <div className='animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent' />
            ) : (
              <LockOpenIcon className='w-4 h-4' />
            )}
            <span>Stop Editing</span>
          </button>
        )}

        {locked && !ownedByCurrentUser && isAdmin && (
          <button
            onClick={handleForceLock}
            disabled={disabled || isLoading}
            className='btn-danger flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isForcingLock ? (
              <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
            ) : (
              <ExclamationTriangleIcon className='w-4 h-4' />
            )}
            <span>Take Control</span>
          </button>
        )}

        {locked && !ownedByCurrentUser && !isAdmin && (
          <div className='bg-gray-100 px-4 py-2 rounded-lg flex items-center space-x-2 text-gray-600'>
            <LockClosedIcon className='w-4 h-4' />
            <span className='text-sm'>Being edited by {currentLock?.userInfo.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LockControls;
