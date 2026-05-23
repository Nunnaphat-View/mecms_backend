import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from '../task.entity.js';

@Entity('measurements')
export class Measurement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  parameter_name: string | null;

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @Column({ type: 'enum', enum: ['PASS', 'FAIL'], default: 'PASS' })
  result: 'PASS' | 'FAIL';

  @Column({ type: 'varchar', length: 255, nullable: true })
  display_type: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resolution: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  std_type: string | null;

  @ManyToOne(() => Task, (task) => task.measurements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ nullable: true })
  task_id: number;
}
