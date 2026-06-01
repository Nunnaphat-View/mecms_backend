import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class UpdateItemDto {
  @ApiProperty({
    example: 1,
    required: false,
    description: 'ID ของหมวดหมู่ที่รายการนี้สังกัด',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  category_id?: number;

  @ApiProperty({ example: 'ตรวจสอบสายไฟไม่มีรอยแตก', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1, required: false, description: 'ลำดับการแสดงผล' })
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;
}
