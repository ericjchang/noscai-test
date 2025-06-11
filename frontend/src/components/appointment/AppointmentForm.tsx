import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { Appointment, AppointmentFormData, AppointmentStatus, User } from '../../types';
import { useLock } from '../../hooks/useLock';
import LockIndicator from '../lock/LockIndicator';
import LockControls from '../lock/LockControls';

interface AppointmentFormProps {
  appointment?: Appointment;
  users: User[];
  onSubmit: (data: AppointmentFormData & { version?: number }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  users,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(!appointment);
  const isEditMode = !!appointment;

  const { currentLock, locked, ownedByCurrentUser } = useLock(appointment?.id || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AppointmentFormData>({
    defaultValues: appointment
      ? {
          title: appointment.title,
          description: appointment.description || '',
          startTime: new Date(appointment.startTime).toISOString().slice(0, 16),
          endTime: new Date(appointment.endTime).toISOString().slice(0, 16),
          status: appointment.status,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
        }
      : {
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          status: AppointmentStatus.SCHEDULED,
          patientId: '',
          doctorId: '',
        },
  });

  useEffect(() => {
    if (appointment) {
      reset({
        title: appointment.title,
        description: appointment.description || '',
        startTime: new Date(appointment.startTime).toISOString().slice(0, 16),
        endTime: new Date(appointment.endTime).toISOString().slice(0, 16),
        status: appointment.status,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
      });
    }
  }, [appointment, reset]);

  const handleFormSubmit = (data: AppointmentFormData) => {
    const submitData: AppointmentFormData & { version?: number } = {
      ...data,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
    };

    if (appointment) {
      submitData.version = appointment.version;
    }

    onSubmit(submitData);
  };

  const canEdit = !isEditMode || (isEditMode && ownedByCurrentUser);
  const formDisabled = isLoading || (isEditMode && !ownedByCurrentUser);

  const patients = users.filter(user => user.role === 'user');
  const doctors = users.filter(user => user.role === 'admin'); // Admins act as doctors

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-white rounded-lg shadow-lg p-6'
    >
      {isEditMode && (
        <div className='mb-6'>
          <LockIndicator lock={currentLock} isOwnedByCurrentUser={ownedByCurrentUser} className='mb-4' />

          {!isEditing && <LockControls appointmentId={appointment.id} onEditStart={() => setIsEditing(true)} />}
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Title *</label>
          <input
            {...register('title', { required: 'Title is required' })}
            type='text'
            disabled={formDisabled}
            className='form-input disabled:bg-gray-100 disabled:cursor-not-allowed'
            placeholder='Enter appointment title'
          />
          {errors.title && <p className='text-red-500 text-sm mt-1'>{errors.title.message}</p>}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Description</label>
          <textarea
            {...register('description')}
            rows={3}
            disabled={formDisabled}
            className='form-input disabled:bg-gray-100 disabled:cursor-not-allowed'
            placeholder='Enter appointment description'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <CalendarIcon className='w-4 h-4 inline mr-1' />
              Start Time *
            </label>
            <input
              {...register('startTime', { required: 'Start time is required' })}
              type='datetime-local'
              disabled={formDisabled}
              className='form-input disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
            {errors.startTime && <p className='text-red-500 text-sm mt-1'>{errors.startTime.message}</p>}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <ClockIcon className='w-4 h-4 inline mr-1' />
              End Time *
            </label>
            <input
              {...register('endTime', {
                required: 'End time is required',
                validate: value => {
                  const startTime = watch('startTime');
                  if (startTime && value && new Date(value) <= new Date(startTime)) {
                    return 'End time must be after start time';
                  }
                  return true;
                },
              })}
              type='datetime-local'
              disabled={formDisabled}
              className='form-input disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
            {errors.endTime && <p className='text-red-500 text-sm mt-1'>{errors.endTime.message}</p>}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <UserIcon className='w-4 h-4 inline mr-1' />
              Patient *
            </label>
            <select
              {...register('patientId', { required: 'Patient is required' })}
              disabled={formDisabled}
              className='form-input disabled:bg-gray-100 disabled:cursor-not-allowed'
            >
              <option value=''>Select a patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.email})
                </option>
              ))}
            </select>
            {errors.patientId && <p className='text-red-500 text-sm mt-1'>{errors.patientId.message}</p>}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <UserIcon className='w-4 h-4 inline mr-1' />
              Doctor *
            </label>
            <select
              {...register('doctorId', { required: 'Doctor is required' })}
              disabled={formDisabled}
              className='form-input disabled:bg-gray-100 disabled:cursor-not-allowed'
            >
              <option value=''>Select a doctor</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} ({doctor.email})
                </option>
              ))}
            </select>
            {errors.doctorId && <p className='text-red-500 text-sm mt-1'>{errors.doctorId.message}</p>}
          </div>
        </div>

        {isEditMode && (
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Status</label>
            <select
              {...register('status')}
              disabled={formDisabled}
              className='form-input disabled:bg-gray-100 disabled:cursor-not-allowed'
            >
              <option value={AppointmentStatus.SCHEDULED}>Scheduled</option>
              <option value={AppointmentStatus.COMPLETED}>Completed</option>
              <option value={AppointmentStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
        )}

        <div className='flex justify-end space-x-3 pt-4 border-t'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isLoading}
            className='btn-secondary disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Cancel
          </button>
          {canEdit && (
            <button
              type='submit'
              disabled={isLoading || formDisabled}
              className='btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
            >
              {isLoading && (
                <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
              )}
              <span>{isEditMode ? 'Update' : 'Create'} Appointment</span>
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default AppointmentForm;
