import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('standard_tools')
export class StandardTool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tool_name: string | null;

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
}
