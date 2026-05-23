import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { StorageService } from '../storage/storage.service.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

interface RequestWithUser {
  user: { userId: number; username: string };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'สมัครสมาชิก (พร้อมอัปโหลดรูป)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'johndoe' },
        password: { type: 'string', example: '123456' },
        email: { type: 'string', example: 'john@example.com' },
        name: { type: 'string', example: 'John Doe' },
        tel: { type: 'string', example: '0812345678' },
        roleId: { type: 'number', example: 1 },
        image: { type: 'string', format: 'binary', description: 'ไฟล์รูปภาพ' },
      },
      required: ['username', 'password'],
    },
  })
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      registerDto.imageUrl = await this.storageService.uploadFile(
        file,
        'profiles',
      );
    }
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'เข้าสู่ระบบ' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดึงข้อมูลโปรไฟล์ (ต้อง Login)' })
  getProfile(@Request() req: RequestWithUser) {
    return this.authService.getProfile(req.user.userId);
  }
}
