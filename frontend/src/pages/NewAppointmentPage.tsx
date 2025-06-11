import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api';
import { useAppointments } from '../hooks/useAppointments';
import AppointmentForm from '../components/appointment/AppointmentForm';
import { AppointmentFormData } from '../types';

const NewAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { createAppointment, isCreating } = useAppointments();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    staleTime: 10 * 60 * 1000,
  });

  const handleCreateAppointment = async (data: AppointmentFormData) => {
    try {
      await createAppointment(data);
      navigate('/appointments');
    } catch (error) {
      console.error('Failed to create appointment:', error);
    }
  };

  const handleCancel = () => {
    navigate('/appointments');
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center space-x-4'>
        <button
          onClick={() => navigate('/appointments')}
          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
        >
          <ArrowLeftIcon className='w-5 h-5' />
        </button>
        <h1 className='text-2xl font-bold text-gray-900'>Create New Appointment</h1>
      </div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <AppointmentForm
          users={users}
          onSubmit={handleCreateAppointment}
          onCancel={handleCancel}
          isLoading={isCreating}
        />
      </motion.div>
    </div>
  );
};

export default NewAppointmentPage;
