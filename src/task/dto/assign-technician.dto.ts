import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AssignTechnicianDto {
  @ApiProperty({ example: 2, description: 'ID ของช่างที่ต้องการมอบหมายงานให้' })
  @IsInt()
  @IsPositive()
  technician_id: number;
}
