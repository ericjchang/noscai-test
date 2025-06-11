import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useCollaborationStore } from '../../store/collaborationStore';

const Header: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getConnectedUsersCount } = useCollaborationStore();

  const connectedUsers = getConnectedUsersCount();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: 'Appointments', href: '/appointments', current: location.pathname === '/appointments' },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', current: location.pathname === '/admin' }] : []),
  ];

  return (
    <header className='bg-white shadow-sm border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo and Navigation */}
          <div className='flex items-center space-x-8'>
            <Link to='/appointments' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>MA</span>
              </div>
              <span className='text-xl font-bold text-gray-900'>MedApp</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className='hidden md:flex space-x-6'>
              {navigation.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className='flex items-center space-x-4'>
            {/* Connected Users Indicator */}
            {connectedUsers > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className='hidden sm:flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm'
              >
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                <span>{connectedUsers} online</span>
              </motion.div>
            )}

            {/* User Menu */}
            <div className='relative'>
              <div className='flex items-center space-x-3'>
                <div className='hidden sm:block text-right'>
                  <p className='text-sm font-medium text-gray-900'>{user?.name}</p>
                  <p className='text-xs text-gray-500'>{user?.email}</p>
                </div>

                <div className='flex items-center space-x-2'>
                  <UserCircleIcon className='w-8 h-8 text-gray-400' />

                  {/* Desktop Actions */}
                  <div className='hidden md:flex items-center space-x-2'>
                    {isAdmin && (
                      <Link
                        to='/admin'
                        className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
                        title='Admin Panel'
                      >
                        <Cog6ToothIcon className='w-5 h-5' />
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
                      title='Logout'
                    >
                      <ArrowRightStartOnRectangleIcon className='w-5 h-5' />
                    </button>
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className='md:hidden p-2 text-gray-400 hover:text-gray-600'
                  >
                    {isMenuOpen ? <XMarkIcon className='w-5 h-5' /> : <Bars3Icon className='w-5 h-5' />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='md:hidden border-t border-gray-200 py-4'
          >
            <div className='space-y-2'>
              {navigation.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    item.current ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className='border-t border-gray-200 pt-2 mt-2'>
                <button
                  onClick={handleLogout}
                  className='flex items-center space-x-2 w-full px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md'
                >
                  <ArrowRightStartOnRectangleIcon className='w-5 h-5' />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;
