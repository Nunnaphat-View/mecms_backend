import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import type { EquipmentStatus, RiskLevel } from '../equipment.entity.js';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'เครื่องวัดความดัน' })
  @IsString()
  @IsNotEmpty()
  tool_name: string;

  @ApiProperty({ example: 'AST-0001', required: false })
  @IsOptional()
  @IsString()
  asset_code?: string;

  @ApiProperty({ example: 'SN-12345', required: false })
  @IsOptional()
  @IsString()
  serial_number?: string;

  @ApiProperty({ example: 'Omron', required: false })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiProperty({ example: 'HEM-7120', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({
    example: 'ready',
    enum: [
      'ready',
      'calibrating',
      'repair',
      'disabled',
      'active',
      'inactive',
      'maintenance',
    ],
    required: false,
  })
  @IsOptional()
  @IsEnum([
    'ready',
    'calibrating',
    'repair',
    'disabled',
    'active',
    'inactive',
    'maintenance',
  ])
  status?: EquipmentStatus;

  @ApiProperty({
    example: 365,
    description: 'รอบการ calibrate (วัน)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  interval?: number;

  @ApiProperty({ example: '2025-12-26', required: false })
  @IsOptional()
  @IsString()
  calibration_due_date?: string;

  @ApiProperty({ example: '2025-06-26', required: false })
  @IsOptional()
  @IsString()
  calibration_date_last?: string;

  @ApiProperty({
    example: 'medium',
    enum: ['high', 'medium', 'low'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  risk_level?: RiskLevel;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  equipment_type_id?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  sectionId?: number;
}
