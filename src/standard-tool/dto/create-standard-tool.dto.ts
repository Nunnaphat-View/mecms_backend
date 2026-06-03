import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
} from 'class-validator';

export class CreateStandardToolDto {
  @ApiProperty({
    example: 'Digital Multimeter',
    description: 'ชื่อเครื่องมือมาตรฐาน',
  })
  @IsString()
  @IsNotEmpty()
  tool_name: string;

  @ApiProperty({
    example: 'STD-001',
    required: false,
    description: 'รหัสทรัพย์สิน',
  })
  @IsOptional()
  @IsString()
  asset_code?: string;

  @ApiProperty({
    example: 'SN123456',
    required: false,
    description: 'หมายเลขซีเรียล',
  })
  @IsOptional()
  @IsString()
  serial_number?: string;

  @ApiProperty({ example: 'Fluke', required: false, description: 'ผู้ผลิต' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiProperty({ example: '87V', required: false, description: 'รุ่น' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({
    example: '/uploads/cert/std-001.pdf',
    required: false,
    description: 'พาธไฟล์ PDF ใบเซอร์',
  })
  @IsOptional()
  @IsString()
  path_pdf?: string;

  @ApiProperty({
    example: '/uploads/standard-tools/img.jpg',
    required: false,
    description: 'พาธไฟล์รูปภาพเครื่องมือมาตรฐาน',
  })
  @IsOptional()
  @IsString()
  path_image?: string;

  @ApiProperty({
    example: 'CERT-2024-001',
    required: false,
    description: 'เลขที่ใบรับรอง',
  })
  @IsOptional()
  @IsString()
  certificate_number?: string;

  @ApiProperty({
    example: '2024-01-15',
    required: false,
    description: 'วันที่สอบเทียบล่าสุด',
  })
  @IsOptional()
  @IsDateString()
  calibration_date_last?: string;

  @ApiProperty({ example: 'VAC', required: false, description: 'หน่วยวัด' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 1, required: false, description: 'ID หมวดหมู่' })
  @IsOptional()
  @IsInt()
  category_id?: number;
}
