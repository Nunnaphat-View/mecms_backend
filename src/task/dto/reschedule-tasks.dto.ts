import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, ArrayNotEmpty } from 'class-validator';

export class RescheduleTasksDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'รายการ Task ID ที่ต้องการเลื่อนวัน',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  taskIds: number[];

  @ApiProperty({
    example: '2026-06-20',
    description: 'วันที่ใหม่ที่ต้องการย้ายไป (YYYY-MM-DD)',
  })
  @IsDateString()
  newDate: string;
}
