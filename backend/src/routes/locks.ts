import { Router } from 'express';
import * as LockController from '../controllers/LockController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { validateUUID } from '../middleware/validation';
import rateLimit from 'express-rate-limit';

const lockLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 10, // limit 10 req / windowMs / IP
  message: 'Too many lock request, please try again later',
});

export const createLockRoutes = (): Router => {
  const router = Router();

  // Get lock status
  router.get(
    '/:appointmentId/lock-status',
    authMiddleware,
    validateUUID('appointmentId'),
    lockLimiter,
    LockController.getLockStatus
  );

  // Acquire Lock
  router.post(
    '/:appointmentId/acquire-lock',
    authMiddleware,
    validateUUID('appointmentId'),
    lockLimiter,
    LockController.acquireLock
  );

  // Release lock
  router.delete(
    '/:appointmentId/release-lock',
    authMiddleware,
    validateUUID('appointmentId'),
    LockController.releaseLock
  );

  // Force lock (admin only)
  router.post(
    '/:appointmentId/force-lock',
    authMiddleware,
    adminMiddleware,
    validateUUID('appointmentId'),
    LockController.forceLock
  );

  // Admin endpoints
  router.get(
    '/:appointmentId/locks',
    authMiddleware,
    adminMiddleware,
    validateUUID('appointmentId'),
    LockController.getAppointmentLocks
  );

  router.get(
    '/users/:userId/locks',
    authMiddleware,
    adminMiddleware,
    validateUUID('userId'),
    LockController.getUserLocks
  );

  router.delete(
    '/users/:userId/locks',
    authMiddleware,
    adminMiddleware,
    validateUUID('userId'),
    LockController.forceReleaseUserLocks
  );

  router.get('/stats/websocket', authMiddleware, adminMiddleware, LockController.getWebSocketStats);

  return router;
};
