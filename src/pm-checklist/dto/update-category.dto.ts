import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'ระบบไฟฟ้า', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 1, required: false, description: 'ลำดับการแสดงผล' })
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;
}
