import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { StorageService } from '../storage/storage.service.js';
import { HospitalService } from './hospital.service.js';
import { CreateHospitalDto } from './dto/create-hospital.dto.js';
import { UpdateHospitalDto } from './dto/update-hospital.dto.js';

@ApiTags('Hospital')
@Controller('hospital')
export class HospitalController {
  constructor(
    private readonly hospitalService: HospitalService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new hospital' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        address: { type: 'string' },
        code: { type: 'string' },
        zipCode: { type: 'string' },
        district: { type: 'string' },
        province: { type: 'string' },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Hospital logo file',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
    }),
  )
  @ApiResponse({
    status: 201,
    description: 'The hospital has been successfully created.',
  })
  async create(
    @Body() createHospitalDto: CreateHospitalDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      createHospitalDto.logoUrl = await this.storageService.uploadFile(
        file,
        'hospitals',
      );
    }
    return this.hospitalService.create(createHospitalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all hospitals' })
  findAll() {
    return this.hospitalService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a hospital by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hospitalService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a hospital' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        address: { type: 'string' },
        code: { type: 'string' },
        zipCode: { type: 'string' },
        district: { type: 'string' },
        province: { type: 'string' },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Hospital logo file',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHospitalDto: UpdateHospitalDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      try {
        const existing = await this.hospitalService.findOne(id);
        if (existing && existing.logoUrl) {
          await this.storageService.deleteFile(existing.logoUrl);
        }
      } catch {
        // Ignore if delete fails
      }
      updateHospitalDto.logoUrl = await this.storageService.uploadFile(
        file,
        'hospitals',
      );
    }
    return this.hospitalService.update(id, updateHospitalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a hospital' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hospitalService.remove(id);
  }
}
