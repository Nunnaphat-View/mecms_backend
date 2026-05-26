/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StandardToolCategory } from './standard-tool-category.entity';

@Entity('standard_tools')
export class StandardTool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  asset_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serial_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path_pdf: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path_image: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  certificate_number: string;

  @Column({ type: 'date', nullable: true })
  calibration_date_last: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  @Column({ type: 'int', nullable: true })
  category_id: number;

  @ManyToOne(() => StandardToolCategory, (category) => category.tools, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: StandardToolCategory;
}
