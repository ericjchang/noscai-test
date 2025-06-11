import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserGroupIcon,
  LockClosedIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import * as api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime, formatTimeRemaining } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Fetch WebSocket stats
  const { data: wsStats, isLoading: wsStatsLoading } = useQuery({
    queryKey: ['websocket-stats'],
    queryFn: () => api.getWebSocketStats(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch user locks
  const { data: userLocks = [], isLoading: userLocksLoading } = useQuery({
    queryKey: ['user-locks', selectedUserId],
    queryFn: () => (selectedUserId ? api.getUserLocks(selectedUserId) : Promise.resolve([])),
    enabled: !!selectedUserId,
    refetchInterval: 3000,
  });

  // Force release user locks mutation
  const forceReleaseUserLocksMutation = useMutation({
    mutationFn: (userId: string) => api.forceReleaseUserLocks(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-locks'] });
      queryClient.invalidateQueries({ queryKey: ['websocket-stats'] });
    },
  });

  const handleForceReleaseUserLocks = async (userId: string, userName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to force release all locks for ${userName}? This will interrupt their current editing sessions.`
    );

    if (confirmed) {
      try {
        await forceReleaseUserLocksMutation.mutateAsync(userId);
        alert('User locks released successfully');
      } catch (error) {
        console.error('Failed to release user locks:', error);
        alert('Failed to release user locks');
      }
    }
  };

  const regularUsers = users.filter(u => u.role === 'user');
  const adminUsers = users.filter(u => u.role === 'admin');

  if (!user || user.role !== 'admin') {
    return (
      <div className='text-center py-12'>
        <ExclamationTriangleIcon className='w-16 h-16 text-red-500 mx-auto mb-4' />
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>Access Denied</h2>
        <p className='text-gray-600'>You need admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Admin Dashboard</h1>
        <p className='text-gray-600 mt-2'>Monitor system activity and manage user locks</p>
      </div>

      {/* WebSocket Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-lg shadow-lg p-6'
      >
        <div className='flex items-center space-x-3 mb-6'>
          <ChartBarIcon className='w-6 h-6 text-blue-600' />
          <h2 className='text-xl font-semibold text-gray-900'>Real-time Statistics</h2>
          {wsStatsLoading && <ArrowPathIcon className='w-4 h-4 animate-spin text-gray-400' />}
        </div>

        {wsStatsLoading ? (
          <LoadingSpinner size='md' />
        ) : wsStats ? (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <div className='bg-blue-50 rounded-lg p-4'>
              <div className='flex items-center space-x-3'>
                <UserGroupIcon className='w-8 h-8 text-blue-600' />
                <div>
                  <p className='text-sm text-blue-600 font-medium'>Connected Users</p>
                  <p className='text-2xl font-bold text-blue-900'>{wsStats.connectedUsers}</p>
                </div>
              </div>
            </div>

            <div className='bg-green-50 rounded-lg p-4'>
              <div className='flex items-center space-x-3'>
                <LockClosedIcon className='w-8 h-8 text-green-600' />
                <div>
                  <p className='text-sm text-green-600 font-medium'>Total Connections</p>
                  <p className='text-2xl font-bold text-green-900'>{wsStats.totalConnections}</p>
                </div>
              </div>
            </div>

            <div className='bg-purple-50 rounded-lg p-4'>
              <div className='flex items-center space-x-3'>
                <ClockIcon className='w-8 h-8 text-purple-600' />
                <div>
                  <p className='text-sm text-purple-600 font-medium'>Active Appointments</p>
                  <p className='text-2xl font-bold text-purple-900'>{wsStats.activeAppointments}</p>
                </div>
              </div>
            </div>

            <div className='bg-orange-50 rounded-lg p-4'>
              <div className='flex items-center space-x-3'>
                <UserIcon className='w-8 h-8 text-orange-600' />
                <div>
                  <p className='text-sm text-orange-600 font-medium'>Participants</p>
                  <p className='text-2xl font-bold text-orange-900'>{wsStats.appointmentParticipants}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className='text-gray-500'>Failed to load statistics</p>
        )}
      </motion.div>

      {/* User Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='bg-white rounded-lg shadow-lg p-6'
      >
        <div className='flex items-center space-x-3 mb-6'>
          <UserGroupIcon className='w-6 h-6 text-indigo-600' />
          <h2 className='text-xl font-semibold text-gray-900'>User Management</h2>
        </div>

        {usersLoading ? (
          <LoadingSpinner size='md' />
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Regular Users */}
            <div>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>Patients ({regularUsers.length})</h3>
              <div className='space-y-3'>
                {regularUsers.map(user => (
                  <div key={user.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div>
                      <p className='font-medium text-gray-900'>{user.name}</p>
                      <p className='text-sm text-gray-600'>{user.email}</p>
                    </div>
                    <button onClick={() => setSelectedUserId(user.id)} className='btn-secondary text-sm'>
                      View Locks
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Users */}
            <div>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>Doctors/Admins ({adminUsers.length})</h3>
              <div className='space-y-3'>
                {adminUsers.map(user => (
                  <div key={user.id} className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                    <div>
                      <p className='font-medium text-gray-900'>{user.name}</p>
                      <p className='text-sm text-gray-600'>{user.email}</p>
                      <span className='inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full'>
                        Admin
                      </span>
                    </div>
                    <button onClick={() => setSelectedUserId(user.id)} className='btn-secondary text-sm'>
                      View Locks
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* User Locks Management */}
      {selectedUserId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-white rounded-lg shadow-lg p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center space-x-3'>
              <LockClosedIcon className='w-6 h-6 text-red-600' />
              <h2 className='text-xl font-semibold text-gray-900'>
                Active Locks for {users.find(u => u.id === selectedUserId)?.name}
              </h2>
            </div>
            <div className='flex items-center space-x-3'>
              <button onClick={() => setSelectedUserId('')} className='btn-secondary'>
                Close
              </button>
              {userLocks.length > 0 && (
                <button
                  onClick={() => {
                    const user = users.find(u => u.id === selectedUserId);
                    if (user) {
                      handleForceReleaseUserLocks(selectedUserId, user.name);
                    }
                  }}
                  disabled={forceReleaseUserLocksMutation.isPending}
                  className='btn-danger flex items-center space-x-2'
                >
                  {forceReleaseUserLocksMutation.isPending ? (
                    <ArrowPathIcon className='w-4 h-4 animate-spin' />
                  ) : (
                    <TrashIcon className='w-4 h-4' />
                  )}
                  <span>Force Release All</span>
                </button>
              )}
            </div>
          </div>

          {userLocksLoading ? (
            <LoadingSpinner size='md' />
          ) : userLocks.length === 0 ? (
            <div className='text-center py-8'>
              <LockClosedIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-500'>No active locks found for this user</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {userLocks.map((lock: any, index: number) => (
                <div key={index} className='border border-gray-200 rounded-lg p-4 bg-red-50'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium text-gray-900'>Appointment: {lock.appointmentId}</p>
                      <p className='text-sm text-gray-600'>Acquired: {formatDateTime(lock.createdAt)}</p>
                      <p className='text-sm text-gray-600'>Expires: {formatDateTime(lock.expiresAt)}</p>
                      <p className='text-sm font-medium text-red-600'>
                        Time Remaining: {formatTimeRemaining(new Date(lock.expiresAt).getTime() - Date.now())}
                      </p>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span className='inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full'>
                        Active Lock
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdminPage;
