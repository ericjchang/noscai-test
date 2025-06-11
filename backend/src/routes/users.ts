import { Router } from 'express';
import * as UserController from '../controllers/UserController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { validateUUID } from '../middleware/validation';

export const createUserRoutes = (): Router => {
  const router = Router();

  router.use(authMiddleware);

  router.get('/', UserController.getUsers);
  router.get('/:userId', validateUUID('userId'), UserController.getUser);
  router.put('/:userId', validateUUID('userId'), UserController.updateUser);

  return router;
};
