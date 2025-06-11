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
      <svg
        stroke={color}
        fill={color}
        strokeWidth='1'
        viewBox='0 0 16 16'
        className='h-6 w-6 -translate-x-[12px] -translate-y-[10px] -rotate-[70deg] transform text-sky-500'
        height='1em'
        width='1em'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path d='M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z'></path>
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
