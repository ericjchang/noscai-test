import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { AppDataSource } from './utils/database';
import * as LockService from './services/LockServices';
import * as WebSocketService from './services/WebSocketServices';
import { createLockRoutes } from './routes/locks';
import { createAppointmentRoutes } from './routes/appointments';
import { createAuthRoutes } from './routes/auth';
import { createUserRoutes } from './routes/users';

dotenv.config();

async function bootstrap() {
  await AppDataSource.initialize();
  console.log('Database Connected');

  const app = express();
  const server = createServer(app);

  LockService.startLockCleanup();
  WebSocketService.initWebSocket(server);

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/auth', createAuthRoutes());
  app.use('/users', createUserRoutes());
  app.use('/appointments', createLockRoutes());
  app.use('/appointments', createAppointmentRoutes());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  });

  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      console.log('HTTP Server closed');
      await AppDataSource.destroy();
      console.log('Database connection closed');
      process.exit(0);
    });

    setTimeout(() => {
      console.error(`Could not close connection in time, force shutdown`);
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});
