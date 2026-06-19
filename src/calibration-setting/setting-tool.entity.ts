import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StandardTool } from '../standard-tool/standard-tool.entity';

@Entity('setting_tools')
export class SettingTool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tool_name', type: 'varchar', length: 255, nullable: true })
  tool_name: string;

  @Column({ name: 'standard_tool_id', type: 'int' })
  standard_tool_id: number;

  @ManyToOne(() => StandardTool, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'standard_tool_id' })
  standardTool: StandardTool;
}
