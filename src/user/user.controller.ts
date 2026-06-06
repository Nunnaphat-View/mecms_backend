import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UploadedFiles,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
import { UpdateSpecialtiesDto } from './dto/update-specialties.dto.js';

interface UserUploadedFiles {
  image?: Express.Multer.File[];
  signature?: Express.Multer.File[];
}

@ApiTags('Users')
@UseInterceptors(ClassSerializerInterceptor)
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
  @ApiOperation({ summary: 'สร้างผู้ใช้ใหม่ (พร้อมอัปโหลดรูปและลายเซ็น)' })
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
        image: {
          type: 'string',
          format: 'binary',
          description: 'ไฟล์รูปภาพโปรไฟล์',
        },
        signature: {
          type: 'string',
          format: 'binary',
          description: 'ไฟล์ลายเซ็น',
        },
      },
      required: ['username', 'password'],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'signature', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const dest =
              file.fieldname === 'signature'
                ? './uploads/signatures'
                : './uploads/profiles';
            cb(null, dest);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const prefix = file.fieldname === 'signature' ? 'sig' : 'profile';
            cb(null, `${prefix}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFiles()
    files: UserUploadedFiles,
  ) {
    if (files?.image?.[0]) {
      createUserDto.imageUrl = `/uploads/profiles/${files.image[0].filename}`;
    }
    if (files?.signature?.[0]) {
      createUserDto.signatureUrl = `/uploads/signatures/${files.signature[0].filename}`;
    }
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลผู้ใช้ (พร้อมอัปโหลดรูปและลายเซ็น)' })
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
        image: {
          type: 'string',
          format: 'binary',
          description: 'ไฟล์รูปภาพโปรไฟล์',
        },
        signature: {
          type: 'string',
          format: 'binary',
          description: 'ไฟล์ลายเซ็น',
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'signature', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const dest =
              file.fieldname === 'signature'
                ? './uploads/signatures'
                : './uploads/profiles';
            cb(null, dest);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const prefix = file.fieldname === 'signature' ? 'sig' : 'profile';
            cb(null, `${prefix}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFiles()
    files: UserUploadedFiles,
  ) {
    if (files?.image?.[0]) {
      updateUserDto.imageUrl = `/uploads/profiles/${files.image[0].filename}`;
    }
    if (files?.signature?.[0]) {
      updateUserDto.signatureUrl = `/uploads/signatures/${files.signature[0].filename}`;
    }
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบผู้ใช้' })
  @ApiParam({ name: 'id', type: Number, description: 'ID ของผู้ใช้' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @Get(':id/specialties')
  @ApiOperation({ summary: 'ดึงข้อมูลความเชี่ยวชาญของช่าง' })
  @ApiParam({ name: 'id', type: Number, description: 'ID ของผู้ใช้ (ช่าง)' })
  getSpecialties(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getSpecialties(id);
  }

  @Put(':id/specialties')
  @ApiOperation({ summary: 'อัปเดตข้อมูลความเชี่ยวชาญของช่าง' })
  @ApiParam({ name: 'id', type: Number, description: 'ID ของผู้ใช้ (ช่าง)' })
  updateSpecialties(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSpecialtiesDto: UpdateSpecialtiesDto,
  ) {
    return this.userService.updateSpecialties(
      id,
      updateSpecialtiesDto.toolNames,
    );
  }
}
