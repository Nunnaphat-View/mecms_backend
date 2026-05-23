import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../storage/storage.service.js';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StandardToolService } from './standard-tool.service.js';
import { CreateStandardToolDto } from './dto/create-standard-tool.dto.js';
import { UpdateStandardToolDto } from './dto/update-standard-tool.dto.js';

@ApiTags('Standard Tool')
@Controller('standard-tool')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StandardToolController {
  constructor(
    private readonly standardToolService: StandardToolService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'รายการเครื่องมือมาตรฐานทั้งหมด' })
  @ApiResponse({ status: 200, description: 'คืนค่า Array ของ StandardTool' })
  findAll() {
    return this.standardToolService.findAll();
  }

  @Get('categories')
  @ApiOperation({ summary: 'รายการประเภทเครื่องมือมาตรฐานทั้งหมด' })
  findAllCategories() {
    return this.standardToolService.findAllCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'เพิ่มประเภทเครื่องมือมาตรฐานใหม่' })
  createCategory(@Body('name') name: string) {
    return this.standardToolService.createCategory(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'เรียกดูเครื่องมือมาตรฐานรายชิ้น' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.standardToolService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'เพิ่มเครื่องมือมาตรฐานใหม่' })
  @ApiResponse({ status: 201, description: 'สร้างสำเร็จ' })
  create(@Body() dto: CreateStandardToolDto) {
    return this.standardToolService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลเครื่องมือมาตรฐาน' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStandardToolDto,
  ) {
    return this.standardToolService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบเครื่องมือมาตรฐาน' })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.standardToolService.remove(id);
  }

  @Post(':id/upload-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  @ApiOperation({ summary: 'อัปโหลดไฟล์ PDF ใบรับรองเครื่องมือมาตรฐาน' })
  async uploadPdf(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileUrl = await this.storageService.uploadFile(
      file,
      'standard-tools',
    );
    return this.standardToolService.updatePdfPath(id, fileUrl);
  }
}
