import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../utils/database';
import { User } from '../models/User';

const getUserRepo = (): Repository<User> => AppDataSource.getRepository(User);

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRepo = getUserRepo();
    const users = await userRepo.find({
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
    });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const userRepo = getUserRepo();

    const user = await userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
    });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { name, role } = req.body;
    const currentUser = (req as any).user;

    if (currentUser.userId !== userId && currentUser.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    if (role && currentUser.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only admins can change user roles',
      });
      return;
    }

    const userRepo = getUserRepo();
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (name) user.name = name;
    if (role && currentUser.role === 'admin') user.role = role;

    const updatedUser = await userRepo.save(user);

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
};
