import { Router } from 'express';
import * as AppointmentController from '../controllers/AppointmentController';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { validateAppointment, validateAppointmentUpdate, validateUUID } from '../middleware/validation';

export const createAppointmentRoutes = (): Router => {
  const router = Router();

  // Public viewing
  router.get('/', optionalAuthMiddleware, AppointmentController.getAppointments);

  // Get specific appointment
  router.get('/:appointmentId', authMiddleware, validateUUID('appointmentId'), AppointmentController.getAppointment);

  // Create appointment
  router.post('/', authMiddleware, validateAppointment, AppointmentController.createAppointment);

  // Update appointment
  router.put(
    '/:appointmentId',
    authMiddleware,
    validateUUID('appointmentId'),
    validateAppointmentUpdate,
    AppointmentController.updateAppointment
  );

  // Delete appointment
  router.delete(
    '/:appointmentId',
    authMiddleware,
    validateUUID('appointmentId'),
    AppointmentController.deleteAppointment
  );

  return router;
};
