import { Router } from 'express';
import * as AuthController from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';
import { validateLogin, validateRegister } from '../middleware/validation';

export const createAuthRoutes = (): Router => {
  const router = Router();

  // Public routes
  router.post('/login', validateLogin, AuthController.login);
  router.post('/register', validateRegister, AuthController.register);

  // Protected routes
  router.post('/logout', authMiddleware, AuthController.logout);
  router.get('/profile', authMiddleware, AuthController.getProfile);

  return router;
};
