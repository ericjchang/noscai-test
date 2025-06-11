import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAppointments } from '../hooks/useAppointments';
import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api';
import { AppointmentStatus } from '../types';
import { formatDateTime, getStatusColor } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AppointmentsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [doctorFilter, setDoctorFilter] = useState('');

  const { appointments, pagination, isLoading, error } = useAppointments({
    page,
    limit: 10,
    status: statusFilter || undefined,
    doctorId: doctorFilter || undefined,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    staleTime: 10 * 60 * 1000,
  });

  const doctors = users.filter(user => user.role === 'admin');

  // Filter appointments by search term
  const filteredAppointments = appointments.filter(
    (appointment: any) =>
      appointment.title.toLowerCase().includes(search.toLowerCase()) ||
      appointment.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      appointment.doctor.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading && appointments.length === 0) {
    return <LoadingSpinner className='py-12' />;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Appointments</h1>
          <p className='text-gray-600 mt-1'>Manage your medical appointments</p>
        </div>
        <div className='mt-4 sm:mt-0'>
          <Link to='/appointments/new' className='btn-primary flex items-center space-x-2'>
            <PlusIcon className='w-4 h-4' />
            <span>New Appointment</span>
          </Link>
        </div>
      </div>

      <div className='bg-white rounded-lg shadow-sm p-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* Search */}
          <div className='relative'>
            <MagnifyingGlassIcon className='w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='Search appointments...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='form-input pl-10'
            />
          </div>

          {/* Status Filter */}
          <div className='relative'>
            <FunnelIcon className='w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as AppointmentStatus | '')}
              className='form-input pl-10'
            >
              <option value=''>All Statuses</option>
              <option value={AppointmentStatus.SCHEDULED}>Scheduled</option>
              <option value={AppointmentStatus.COMPLETED}>Completed</option>
              <option value={AppointmentStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>

          {/* Doctor Filter */}
          <div className='relative'>
            <UserIcon className='w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)} className='form-input pl-10'>
              <option value=''>All Doctors</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setDoctorFilter('');
            }}
            className='btn-secondary'
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
        {filteredAppointments.length === 0 ? (
          <div className='text-center py-12'>
            <CalendarIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>No appointments found</h3>
            <p className='text-gray-500 mb-6'>
              {search || statusFilter || doctorFilter
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first appointment.'}
            </p>
            <Link to='/appointments/new' className='btn-primary'>
              Create Appointment
            </Link>
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {filteredAppointments.map((appointment: any, index: any) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className='p-6 hover:bg-gray-50 transition-colors'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <Link
                        to={`/appointments/${appointment.id}`}
                        className='text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors'
                      >
                        {appointment.title}
                      </Link>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>

                    {appointment.description && (
                      <p className='text-gray-600 mb-3 line-clamp-2'>{appointment.description}</p>
                    )}

                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600'>
                      <div className='flex items-center space-x-2'>
                        <ClockIcon className='w-4 h-4' />
                        <span>{formatDateTime(appointment.startTime)}</span>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <UserIcon className='w-4 h-4' />
                        <span>Patient: {appointment.patient.name}</span>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <UserIcon className='w-4 h-4' />
                        <span>Doctor: {appointment.doctor.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className='ml-6 flex-shrink-0'>
                    <Link to={`/appointments/${appointment.id}`} className='btn-secondary'>
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className='bg-gray-50 px-6 py-4 border-t border-gray-200'>
            <div className='flex items-center justify-between'>
              <div className='text-sm text-gray-600'>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>

              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className='btn-secondary disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>

                <span className='text-sm text-gray-600'>
                  Page {page} of {pagination.pages}
                </span>

                <button
                  className='btn-secondary disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={page === pagination.pages}
                  onClick={() => setPage(page + 1)}
                ></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
