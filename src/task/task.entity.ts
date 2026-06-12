import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity.js';
import { Equipment } from '../equipment/equipment.entity.js';
import { Environment } from './entities/environment.entity.js';
import { Measurement } from './entities/measurement.entity.js';
import { Qualitative } from './entities/qualitative.entity.js';
import { StandardTool } from '../standard-tool/standard-tool.entity.js';
import { PmChecklistResult } from '../pm-checklist/entities/pm-checklist-result.entity.js';
import { PmCategoryRemark } from '../pm-checklist/entities/pm-category-remark.entity.js';
import { SpecificParameter } from './entities/specific-parameter.entity.js';
import { StandardDetail } from './entities/standard-detail.entity.js';

import { TaskCertificate } from './entities/task-certificate.entity.js';

export type TaskStatus =
  | 'Pending'
  | 'InProgress'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'ReCalibrate'
  | 'Done';
export type OverallResult = 'Pass' | 'Fail' | 'NA';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  equipment_id: number;

  @ManyToOne(() => Equipment, { nullable: true, eager: false })
  @JoinColumn({ name: 'equipment_id' })
  equipment: Equipment;

  @Column({
    name: 'cal_no',
    type: 'varchar',
    length: 50,
    nullable: true,
    unique: true,
  })
  cal_no: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  overall_result: OverallResult;

  @Column({ type: 'varchar', length: 20, default: 'Pending' })
  status: TaskStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  path_pdf_pm: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'int', nullable: true })
  technician_id: number;

  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'technician_id' })
  technician: User;

  @Column({ type: 'int', nullable: true })
  approver_id: number;

  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @OneToMany(() => Environment, (env) => env.task)
  environments: Environment[];

  @OneToMany(() => Measurement, (m) => m.task)
  measurements: Measurement[];

  @OneToMany(() => Qualitative, (q) => q.task)
  qualitatives: Qualitative[];

  @OneToMany(() => StandardDetail, (sd) => sd.task, { cascade: true })
  standardDetails: StandardDetail[];

  standardTools?: StandardTool[];

  @OneToMany(() => PmChecklistResult, (result) => result.task)
  checklistResults: PmChecklistResult[];

  @OneToMany(() => PmCategoryRemark, (remark) => remark.task)
  checklistRemarks: PmCategoryRemark[];

  @OneToMany(() => SpecificParameter, (sp) => sp.task)
  specificParameters: SpecificParameter[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'date', nullable: true })
  scheduled_date: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  path_pdf_cer: string;

  @OneToOne(() => TaskCertificate, (cert) => cert.task, { cascade: true })
  certificate: TaskCertificate;

  // Unified JSONB Snapshot for Certificates (Virtual property - populated dynamically)
  certificate_data?: any;
}
