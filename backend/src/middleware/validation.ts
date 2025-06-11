import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateAppointment = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().min(1).max(1000).optional(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
    status: Joi.string().valid('scheduled', 'completed', 'cancelled').optional(),
    patientId: Joi.string().uuid().required(),
    doctorId: Joi.string().uuid().required(),
    version: Joi.number().integer().min(1).optional(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      details: error.details.map(detail => detail.message),
    });
    return;
  }

  next();
};

export const validateAppointmentUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional(),
    startTime: Joi.date().iso().optional(),
    endTime: Joi.date().iso().optional(),
    status: Joi.string().valid('scheduled', 'completed', 'cancelled').optional(),
    version: Joi.number().integer().min(1).optional(),
  })
    .custom((val, helpers) => {
      if (val.startTime && val.endTime && new Date(val.endTime) <= new Date(val.startTime)) {
        return helpers.error('custom.endTimeAfterStartTime');
      }
      return val;
    })
    .messages({
      'custom.endTimeAfterStartTime': 'End time must be after start time',
    });

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message),
    });
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message),
    });
    return;
  }

  next();
};

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(1).max(100).required(),
    role: Joi.string().valid('user', 'admin').optional(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message),
    });
    return;
  }

  next();
};

export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const schema = Joi.string().uuid().required();
    const { error } = schema.validate(req.params[paramName]);

    if (error) {
      res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
      return;
    }

    next();
  };
};
