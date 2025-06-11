import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';

export interface UserInfo {
  name: string;
  email: string;
  position?: { x: number; y: number };
}

@Entity('appointment_locks')
@Index(['appointmentId'], { unique: true })
export class AppointmentLock {
  @PrimaryColumn('uuid')
  appointmentId: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('jsonb')
  userInfo: UserInfo;

  @Column('timestamp')
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  lastActivity: Date;
}
