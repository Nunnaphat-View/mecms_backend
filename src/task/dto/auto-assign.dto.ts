import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class AutoAssignDto {
  @ApiProperty({ example: 6, description: 'เดือนที่ต้องการจัดตาราง (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026, description: 'ปีคริสต์ศักราช (เช่น 2026)' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
