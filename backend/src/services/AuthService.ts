import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};

export const refreshToken = (user: User): string => {
  return generateToken(user);
};
