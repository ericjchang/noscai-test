import 'reflect-metadata';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../utils/database';
import { User, UserRole } from '../models/User';

dotenv.config();

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected for seeding');

  const userRepo = AppDataSource.getRepository(User);

  const adminPassword = await bcrypt.hash('password', 10);
  const admin = userRepo.create({
    email: 'admin@example.com',
    password: adminPassword,
    name: 'Admin User',
    role: UserRole.ADMIN,
  });

  const userPassword = await bcrypt.hash('password', 10);
  const user = userRepo.create({
    email: 'user@example.com',
    password: userPassword,
    name: 'John Doe',
    role: UserRole.USER,
  });

  const doctorPassword = await bcrypt.hash('password', 10);
  const doctor = userRepo.create({
    email: 'doctor@example.com',
    password: doctorPassword,
    name: 'Dr. Jane Smith',
    role: UserRole.ADMIN,
  });

  await userRepo.save([admin, user, doctor]);

  console.log('Seeding completed!');
  console.log('Admin: admin@example.com / password');
  console.log('User: user@example.com / password');
  console.log('Doctor: doctor@example.com / password');

  await AppDataSource.destroy();
}

seed().catch(console.error);
