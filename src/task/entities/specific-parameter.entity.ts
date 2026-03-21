import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from '../task.entity.js';

@Entity('specific_parameters')
export class SpecificParameter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  value: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string | null;

  @Column({ type: 'int' })
  task_id: number;

  @ManyToOne(() => Task, (task) => task.specificParameters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: Task;
}
