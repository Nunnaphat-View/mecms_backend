import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

const imageStorage = diskStorage({
  destination: './uploads/profiles',
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `profile-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายการผู้ใช้ทั้งหมด' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงผู้ใช้ตาม ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID ของผู้ใช้' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'สร้างผู้ใช้ใหม่ (พร้อมอัปโหลดรูป)' })
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
        roleId: { type: 'integer', example: 1 },
        image: { type: 'string', format: 'binary', description: 'ไฟล์รูปภาพ' },
      },
      required: ['username', 'password'],
    },
  })
  @UseInterceptors(FileInterceptor('image', { storage: imageStorage }))
  create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createUserDto.imageUrl = `/uploads/profiles/${file.filename}`;
    }
    return this.userService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลผู้ใช้ (พร้อมอัปโหลดรูป)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID ของผู้ใช้' })
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
    },
  })
  @UseInterceptors(FileInterceptor('image', { storage: imageStorage }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      updateUserDto.imageUrl = `/uploads/profiles/${file.filename}`;
    }
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบผู้ใช้' })
  @ApiParam({ name: 'id', type: Number, description: 'ID ของผู้ใช้' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
