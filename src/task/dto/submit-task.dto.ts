import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MeasurementDto {
  @ApiProperty({ example: 'NIBP - Systolic' })
  @IsString()
  parameter_name: string;

  @ApiProperty({ example: 120, required: false })
  @IsOptional()
  @IsNumber()
  range?: number;

  @ApiProperty({ example: 120, required: false })
  @IsOptional()
  @IsNumber()
  standard_value?: number;

  @ApiProperty({ example: 121, required: false })
  @IsOptional()
  @IsNumber()
  reading_1?: number;

  @ApiProperty({ example: 120, required: false })
  @IsOptional()
  @IsNumber()
  reading_2?: number;

  @ApiProperty({ example: 120, required: false })
  @IsOptional()
  @IsNumber()
  reading_3?: number;

  @ApiProperty({ example: 120.3, required: false })
  @IsOptional()
  @IsNumber()
  average_value?: number;

  @ApiProperty({ example: 0.3, required: false })
  @IsOptional()
  @IsNumber()
  error_value?: number;

  @ApiProperty({ enum: ['PASS', 'FAIL'], example: 'PASS' })
  @IsEnum(['PASS', 'FAIL'])
  result: 'PASS' | 'FAIL';

  @ApiProperty({ example: 'Digital', required: false })
  @IsOptional()
  @IsString()
  display_type?: string;

  @ApiProperty({ example: '0.1', required: false })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiProperty({ example: 0.002, required: false })
  @IsOptional()
  @IsNumber()
  ucb1?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  ucb2?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  ucb3?: number;
}

class QualitativeDto {
  @ApiProperty({ example: 'EKG', required: false })
  @IsOptional()
  @IsString()
  parameter_name?: string;

  @ApiProperty({ example: 'Lead I' })
  @IsString()
  item_name: string;

  @ApiProperty({ enum: ['PASS', 'FAIL', 'NA'], example: 'PASS' })
  @IsEnum(['PASS', 'FAIL', 'NA'])
  result: 'PASS' | 'FAIL' | 'NA';
}

class SpecificParameterDto {
  @ApiProperty({ example: 'IV Set' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Covex', required: false })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({ example: 'Drop/mL', required: false })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class SubmitTaskDto {
  @ApiProperty({ example: 25.5, description: 'อุณหภูมขณะสอบเทียบ (°C)' })
  @IsOptional()
  @IsNumber()
  ambient_temp?: number;

  @ApiProperty({ example: 45.0, description: 'ความชื้นขณะสอบเทียบ (%RH)' })
  @IsOptional()
  @IsNumber()
  ambient_humidity?: number;

  @ApiProperty({
    example: [1, 2],
    description: 'ID ของเครื่องมือมาตรฐานที่ใช้สอบเทียบ',
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  standard_tool_ids?: number[];

  @ApiProperty({
    type: [MeasurementDto],
    description: 'รายการผลการวัดเชิงปริมาณ',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  measurements?: MeasurementDto[];

  @ApiProperty({
    type: [QualitativeDto],
    description: 'รายการตรวจสอบเชิงคุณภาพ',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualitativeDto)
  qualitatives?: QualitativeDto[];

  @ApiProperty({
    type: [SpecificParameterDto],
    description: 'รายการตัวแปรเฉพาะของเครื่องมือ',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificParameterDto)
  specific_parameters?: SpecificParameterDto[];

  @ApiProperty({
    enum: ['Pass', 'Fail', 'NA'],
    example: 'Pass',
    description: 'ผลสรุปการสอบเทียบภาพรวม',
  })
  @IsEnum(['Pass', 'Fail', 'NA'])
  overall_result: 'Pass' | 'Fail' | 'NA';
}
