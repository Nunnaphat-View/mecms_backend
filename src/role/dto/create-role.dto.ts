import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'admin', description: 'ชื่อ Role' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'ผู้ดูแลระบบ', description: 'คำอธิบาย Role' })
  @IsOptional()
  @IsString()
  description?: string;
}
