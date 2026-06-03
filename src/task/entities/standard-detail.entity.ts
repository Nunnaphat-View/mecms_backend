import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from '../task.entity.js';
import { StandardTool } from '../../standard-tool/standard-tool.entity.js';

@Entity('standard_detail')
export class StandardDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'task_id', type: 'int' })
  task_id: number;

  @Column({ name: 'standard_tool_id', type: 'int' })
  standard_tool_id: number;

  @ManyToOne(() => Task, (task) => task.standardDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => StandardTool, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'standard_tool_id' })
  standardTool: StandardTool;
}
