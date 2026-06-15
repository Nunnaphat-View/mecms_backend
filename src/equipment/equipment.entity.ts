import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EquipmentType } from './equipment-type.entity.js';
import { Section } from '../section/entities/section.entity.js';

export type EquipmentStatus =
  | 'ready'
  | 'calibrating'
  | 'repair'
  | 'disabled'
  | 'active' // Keep for compatibility temporarily
  | 'inactive' // Keep for compatibility temporarily
  | 'maintenance'; // Keep for compatibility temporarily
export type RiskLevel = 'high' | 'medium' | 'low';

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  tool_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  asset_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serial_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model: string;

  @Column({
    type: 'enum',
    enum: [
      'ready',
      'calibrating',
      'repair',
      'disabled',
      'active',
      'inactive',
      'maintenance',
    ],
    default: 'ready',
  })
  status: EquipmentStatus;

  @Column({
    type: 'enum',
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  })
  risk_level: RiskLevel;

  @Column({ type: 'int', nullable: true })
  equipment_type_id: number;

  @ManyToOne(() => EquipmentType, (type) => type.equipments)
  @JoinColumn({ name: 'equipment_type_id' })
  equipmentType: EquipmentType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  path_pdf: string;

  @Column({ type: 'int', nullable: true })
  interval: number;

  @Column({ type: 'date', nullable: true })
  calibration_due_date: Date;

  @Column({ type: 'date', nullable: true })
  calibration_date_last: Date;

  @Column({ nullable: true })
  sectionId: number;

  @ManyToOne(() => Section, (section) => section.equipments)
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
