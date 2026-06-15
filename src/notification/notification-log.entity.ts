import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type NotificationChannel = 'line' | 'email' | 'in_app';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ['line', 'email', 'in_app'],
    default: 'line',
  })
  channel: NotificationChannel;

  @Column({ type: 'varchar', length: 100 })
  notificationType: string;

  @Column({ type: 'int', nullable: true })
  equipmentId: number | null;

  @Column({ type: 'int', nullable: true })
  recipientId: number | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  })
  status: NotificationStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  sentAt: Date | null;
}
