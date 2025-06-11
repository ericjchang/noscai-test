import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Appointment } from '../models/Appointment';
import { AppointmentLock } from '../models/AppointmentLock';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'noscai-test',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'developement',
  entities: [User, Appointment, AppointmentLock],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});
