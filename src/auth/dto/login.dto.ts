import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'johndoe', description: 'ชื่อผู้ใช้' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: '123456', description: 'รหัสผ่าน', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
