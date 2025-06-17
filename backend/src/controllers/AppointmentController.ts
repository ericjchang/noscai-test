import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../utils/database';
import { Appointment } from '../models/Appointment';
import * as LockService from '../services/LockServices';
import * as WebsocketService from '../services/WebSocketServices';

const getAppointmentRepo = (): Repository<Appointment> => AppDataSource.getRepository(Appointment);

export const getAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const appointmentRepo = getAppointmentRepo();

    const appointment = await appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'doctor'],
    });

    if (!appointment) {
      res.status(404).json({
        success: false,
        message: 'Appointment not foudn',
      });
      return;
    }

    const lockInfo = await LockService.getLockInfo(appointmentId);

    res.json({
      success: true,
      appointment,
      lock: lockInfo,
    });
  } catch (err) {
    console.error('Error getting appointment:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment',
    });
  }
};

export const updateAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const userId = (req as any).user.userId;
    const updateData = req.body;

    const lockInfo = await LockService.getLockInfo(appointmentId);
    if (!lockInfo || lockInfo.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You must have an active lock to edit this appointment',
      });
      return;
    }

    const appointmentRepo = getAppointmentRepo();

    // optimistic lock
    const appointment = await appointmentRepo.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
      return;
    }

    if (updateData.version && updateData.version !== appointment.version) {
      res.status(400).json({
        success: false,
        message: 'Appointment has been modified by another user, Please refresh and try again',
      });
      return;
    }

    const updatedAppointment = await appointmentRepo.save({
      ...appointment,
      ...updateData,
      version: appointment.version + 1,
      updatedAt: new Date(),
    });

    const appointmentData = await appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'doctor'],
    });

    await WebsocketService.broadcastAppointmentUpdate(appointmentId, userId, appointmentData);

    res.json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (err) {
    console.error('Error updating appointment', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
    });
  }
};

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, doctorId, patientId } = req.query;
    const appointmentRepo = getAppointmentRepo();

    const queryBuilder = appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor');

    if (status) {
      queryBuilder.andWhere('appointment.status = :status', { status });
    }

    if (doctorId) {
      queryBuilder.andWhere('appointment.doctorId = :doctorId', { doctorId });
    }

    if (patientId) {
      queryBuilder.andWhere('appointment.patientId = :patientId', { patientId });
    }

    const skip = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(skip).take(Number(limit));

    queryBuilder.orderBy('appointment.startTime', 'ASC');

    const [appointments, total] = await queryBuilder.getManyAndCount();

    res.json({
      success: true,
      appointments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Error getting appointments:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
    });
  }
};

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointmentData = req.body;
    const appointmentRepo = getAppointmentRepo();

    const newAppointment = await appointmentRepo.save({
      ...appointmentData,
      version: 1,
    });

    const appointmentId = Array.isArray(newAppointment) ? newAppointment[0].id : newAppointment.id;

    const appointment = await appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'doctor'],
    });

    res.status(201).json({
      success: true,
      appointment,
    });
  } catch (err) {
    console.error('Error creating appointment', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
    });
  }
};

export const deleteAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const userId = (req as any).user.userId;

    const lockInfo = await LockService.getLockInfo(appointmentId);
    if (lockInfo && lockInfo.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Cannot delete appointment while it is being edited by another user',
      });
      return;
    }

    const appointmentRepo = getAppointmentRepo();
    const result = await appointmentRepo.delete(appointmentId);

    if (result.affected === 0) {
      res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
      return;
    }

    if (lockInfo) {
      await LockService.releaseLock(appointmentId, userId);
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting appointment: ', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
    });
  }
};
