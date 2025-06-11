import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAppointment } from '../hooks/useAppointments';
import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api';
import AppointmentForm from '../components/appointment/AppointmentForm';
import CollaborativeCursors from '../components/collaboration/CollaborativeCursor';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDateTime, getStatusColor } from '../utils/helpers';

const AppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const { appointment, lock, isLoading, error, refetch } = useAppointment(id!);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    staleTime: 10 * 60 * 1000,
  });

  const handleUpdateAppointment = async (data: any) => {
    try {
      // Update appointment logic here
      await refetch();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update appointment:', error);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!appointment) return;

    const confirmed = window.confirm('Are you sure you want to delete this appointment?');
    if (confirmed) {
      try {
        await api.deleteAppointment(appointment.id);
        navigate('/appointments');
      } catch (error) {
        console.error('Failed to delete appointment:', error);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !appointment) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>Appointment not found</p>
        <button onClick={() => navigate('/appointments')} className='mt-4 btn-primary'>
          Back to Appointments
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <CollaborativeCursors appointmentId={appointment.id} isEnabled={true} />

      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <button
            onClick={() => navigate('/appointments')}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <ArrowLeftIcon className='w-5 h-5' />
          </button>
          <h1 className='text-2xl font-bold text-gray-900'>{isEditing ? 'Edit Appointment' : 'Appointment Details'}</h1>
        </div>

        {!isEditing && (
          <div className='flex items-center space-x-3'>
            <button onClick={() => setIsEditing(true)} className='btn-secondary flex items-center space-x-2'>
              <PencilIcon className='w-4 h-4' />
              <span>Edit</span>
            </button>
            <button onClick={handleDeleteAppointment} className='btn-danger flex items-center space-x-2'>
              <TrashIcon className='w-4 h-4' />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <AppointmentForm
          appointment={appointment}
          users={users}
          onSubmit={handleUpdateAppointment}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-lg shadow-lg p-6'
        >
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <h2 className='text-lg font-semibold text-gray-900'>Basic Information</h2>

              <div>
                <label className='block text-sm font-medium text-gray-500'>Title</label>
                <p className='text-gray-900'>{appointment.title}</p>
              </div>

              {appointment.description && (
                <div>
                  <label className='block text-sm font-medium text-gray-500'>Description</label>
                  <p className='text-gray-900'>{appointment.description}</p>
                </div>
              )}

              <div>
                <label className='block text-sm font-medium text-gray-500'>Status</label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    appointment.status
                  )}`}
                >
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>
            </div>

            <div className='space-y-4'>
              <h2 className='text-lg font-semibold text-gray-900'>Schedule & People</h2>

              <div>
                <label className='block text-sm font-medium text-gray-500'>Start Time</label>
                <p className='text-gray-900'>{formatDateTime(appointment.startTime)}</p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-500'>End Time</label>
                <p className='text-gray-900'>{formatDateTime(appointment.endTime)}</p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-500'>Patient</label>
                <p className='text-gray-900'>
                  {appointment.patient.name} ({appointment.patient.email})
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-500'>Doctor</label>
                <p className='text-gray-900'>
                  {appointment.doctor.name} ({appointment.doctor.email})
                </p>
              </div>
            </div>
          </div>

          <div className='mt-6 pt-6 border-t border-gray-200'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500'>
              <div>
                <span className='font-medium'>Created:</span> {formatDateTime(appointment.createdAt)}
              </div>
              <div>
                <span className='font-medium'>Updated:</span> {formatDateTime(appointment.updatedAt)}
              </div>
              <div>
                <span className='font-medium'>Version:</span> {appointment.version}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AppointmentDetailPage;
