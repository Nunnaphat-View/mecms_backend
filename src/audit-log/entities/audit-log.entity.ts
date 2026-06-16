import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['resourceName', 'resourceId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'userId', type: 'int', nullable: true })
  userId: number | null;

  @Column({ name: 'actorName', type: 'varchar', length: 255 })
  actorName: string;

  @Column({ name: 'actorRole', type: 'varchar', length: 100 })
  actorRole: string;

  @Column({ name: 'action', type: 'varchar', length: 100 })
  action: string;

  @Column({ name: 'resourceName', type: 'varchar', length: 100 })
  resourceName: string;

  @Column({ name: 'resourceId', type: 'varchar', length: 100 })
  resourceId: string;

  @Column({ name: 'oldValues', type: 'jsonb', nullable: true })
  oldValues: Record<string, any> | null;

  @Column({ name: 'newValues', type: 'jsonb', nullable: true })
  newValues: Record<string, any> | null;

  @Column({ name: 'ipAddress', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'userAgent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
