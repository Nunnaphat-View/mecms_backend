import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CalibrationSetting } from './calibration-setting.entity';
import { StandardTool } from '../standard-tool/standard-tool.entity';

@Entity('setting_tools')
export class SettingTool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'calibration_setting_id', type: 'int' })
  calibration_setting_id: number;

  @Column({ name: 'standard_tool_id', type: 'int' })
  standard_tool_id: number;

  @ManyToOne(
    () => CalibrationSetting,
    (setting) => setting.settingTools,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'calibration_setting_id' })
  calibrationSetting: CalibrationSetting;

  @ManyToOne(() => StandardTool, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'standard_tool_id' })
  standardTool: StandardTool;
}
