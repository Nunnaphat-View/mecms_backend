import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
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

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  pm_no: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  overall_result: OverallResult;

  @Column({ type: 'varchar', length: 20, default: 'Pending' })
  status: TaskStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  path_pdf_pm: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'int', nullable: true })
  task_user: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'task_user' })
  technician: User;

  @Column({ type: 'int', nullable: true })
  approver_id: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @OneToMany(() => Environment, (env) => env.task)
  environments: Environment[];

  @OneToMany(() => Measurement, (m) => m.task)
  measurements: Measurement[];

  @OneToMany(() => Qualitative, (q) => q.task)
  qualitatives: Qualitative[];

  @ManyToMany(() => StandardTool)
  @JoinTable({
    name: 'standard_detail',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'standard_tool_id', referencedColumnName: 'id' },
  })
  standardTools: StandardTool[];

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

  @Column({ type: 'varchar', length: 500, nullable: true })
  path_pdf_cer: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  technician_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  technician_position: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  technician_signature_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approver_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approver_position: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  approver_signature_url: string;
}
