import {
  IsOptional,
  IsString,
  IsEmail,
  IsInt,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'johndoe', description: 'ชื่อผู้ใช้' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'อีเมล' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'ชื่อ-นามสกุล' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '0812345678', description: 'เบอร์โทรศัพท์' })
  @IsOptional()
  @IsString()
  tel?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL รูปภาพ',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/signature.png',
    description: 'URL ลายเซ็นดิจิทัล',
  })
  @IsOptional()
  @IsString()
  signatureUrl?: string;

  @ApiPropertyOptional({
    example: 'U123456789abcdef0123456789abcdef',
    description: 'LINE User ID',
  })
  @IsOptional()
  @IsString()
  lineUserId?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID ของ Role' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roleId?: number;
}
