import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'admin', description: 'ชื่อ Role' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'ผู้ดูแลระบบ', description: 'คำอธิบาย Role' })
  @IsOptional()
  @IsString()
  description?: string;
}
