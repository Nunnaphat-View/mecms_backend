import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ICalibrationTestValue } from '../calibration-setting.entity';

export class CreateCalibrationSettingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tool_name: string;

  @ApiProperty({ enum: ['quantitative', 'qualitative'] })
  @IsEnum(['quantitative', 'qualitative'])
  type: 'quantitative' | 'qualitative';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  parameter_name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  tolerance?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  std_type?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  display_type?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  resolution?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  uncertainty?: string;

  @ApiProperty({ isArray: true, type: () => Object })
  @IsOptional()
  test_values?: ICalibrationTestValue[];

  @ApiProperty({ type: [Number], required: false, description: 'IDs ของเครื่องมือมาตรฐานที่ใช้สอบเทียบ' })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  standard_tool_ids?: number[];
}
