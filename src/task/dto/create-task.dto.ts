import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 1, description: 'ID ของอุปกรณ์ที่ต้องการทำ PM' })
  @IsInt()
  @IsPositive()
  equipment_id: number;

  @ApiProperty({ example: 5, description: 'User ID ของช่างที่รับผิดชอบ' })
  @IsInt()
  @IsPositive()
  technician_id: number;
}
