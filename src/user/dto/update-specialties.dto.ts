import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSpecialtiesDto {
  @ApiProperty({
    example: ['Infusion Pump', 'Defibrillator'],
    description: 'รายการชื่อของเครื่องมือที่เชี่ยวชาญ',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  toolNames: string[];
}
