import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { StandardTool } from '../standard-tool/standard-tool.entity';

export interface ICalibrationTestValue {
  label: string;
  value: number;
}

@Entity('calibration_settings')
export class CalibrationSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  tool_name: string;

  @Column({
    type: 'enum',
    enum: ['quantitative', 'qualitative'],
    default: 'quantitative',
  })
  type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  parameter_name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tolerance: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  std_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  display_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  resolution: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  uncertainty: string;

  @Column({ type: 'json', nullable: true })
  test_values: ICalibrationTestValue[];

  @ManyToMany(() => StandardTool)
  @JoinTable({
    name: 'calibration_setting_standard_tools',
    joinColumn: { name: 'calibration_setting_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'standard_tool_id', referencedColumnName: 'id' },
  })
  standardTools: StandardTool[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
