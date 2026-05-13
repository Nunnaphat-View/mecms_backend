import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHospitalDto {
  @ApiProperty({ example: 'โรงพยาบาลส่งเสริมสุขภาพตำบล' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'สาขาบางสะพาน', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '123 ม.1 ต.บางสะพาน อ.บางสะพาน จ.ประจวบคีรีขันธ์',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '10000', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ example: '77140', required: false })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({ example: 'บางสะพาน', required: false })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ example: 'ประจวบคีรีขันธ์', required: false })
  @IsString()
  @IsOptional()
  province?: string;
}
