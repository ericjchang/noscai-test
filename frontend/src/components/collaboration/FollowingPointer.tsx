import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FollowingPointerProps {
  x: number;
  y: number;
  userInfo: {
    name: string;
    email: string;
  };
  color?: string;
}

const FollowingPointer: React.FC<FollowingPointerProps> = ({ x, y, userInfo, color = '#3b82f6' }) => {
  return (
    <motion.div
      className='pointer-events-none fixed z-50'
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: `${x}vw`,
        y: `${y}vh`,
      }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
        mass: 0.1,
      }}
    >
      {/* Cursor */}
      <svg width='20' height='20' viewBox='0 0 24 24' fill='none' className='transform -translate-x-1 -translate-y-1'>
        <path
          d='M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z'
          fill={color}
          stroke='white'
          strokeWidth='1'
        />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className='absolute top-6 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap'
        style={{ backgroundColor: color }}
      >
        <div className='font-medium'>{userInfo.name}</div>
        <div className='opacity-75 text-xs'>{userInfo.email}</div>

        {/* Pointer arrow */}
        <div className='absolute -top-1 left-2 w-2 h-2 rotate-45' style={{ backgroundColor: color }} />
      </motion.div>
    </motion.div>
  );
};

export default FollowingPointer;
