import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { LoginCredentials } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    clearError();
    try {
      await login(data);
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='max-w-md w-full bg-white rounded-xl shadow-xl p-8'
      >
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center'>
            <span className='text-white font-bold text-xl'>MA</span>
          </div>
          <h2 className='text-2xl font-bold text-gray-900'>Welcome Back</h2>
          <p className='text-gray-600 mt-2'>Sign in to your medical appointment account</p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6'
          >
            <p className='text-sm'>{error}</p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Email */}
          <div>
            <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
              Email Address
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type='email'
              autoComplete='email'
              className='form-input'
              placeholder='Enter your email'
            />
            {errors.email && <p className='text-red-500 text-sm mt-1'>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-2'>
              Password
            </label>
            <div className='relative'>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                className='form-input pr-10'
                placeholder='Enter your password'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
              >
                {showPassword ? (
                  <EyeSlashIcon className='h-5 w-5 text-gray-400' />
                ) : (
                  <EyeIcon className='h-5 w-5 text-gray-400' />
                )}
              </button>
            </div>
            {errors.password && <p className='text-red-500 text-sm mt-1'>{errors.password.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={isLoading}
            className='w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
          >
            {isLoading ? (
              <>
                <LoadingSpinner size='sm' />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className='mt-8 p-4 bg-gray-50 rounded-lg'>
          <p className='text-sm text-gray-600 font-medium mb-2'>Demo Credentials:</p>
          <div className='space-y-1 text-xs text-gray-500'>
            <p>
              <strong>Admin:</strong> admin@example.com / password
            </p>
            <p>
              <strong>User:</strong> user@example.com / password
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
