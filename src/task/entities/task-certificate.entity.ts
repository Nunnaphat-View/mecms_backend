import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Task } from '../task.entity.js';

export interface IPmChecklistSnapshot {
  item_id: number;
  description: string;
  category_id: number;
  display_order: number;
  status: string;
}

@Entity('task_certificates')
export class TaskCertificate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'task_id', type: 'int', unique: true })
  task_id: number;

  @OneToOne(() => Task, (task) => task.certificate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hospital_name: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  hospital_logo_url: string | null;

  @Column({ type: 'text', nullable: true })
  hospital_address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  hospital_district: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  hospital_province: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  hospital_zip_code: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  department_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  technician_name: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  technician_signature_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approver_name: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  approver_signature_url: string | null;

  @Column({ type: 'jsonb', nullable: true })
  pm_checklist: IPmChecklistSnapshot[] | null;

  @CreateDateColumn()
  createdAt: Date;
}
