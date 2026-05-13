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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { HospitalService } from './hospital.service.js';
import { CreateHospitalDto } from './dto/create-hospital.dto.js';
import { UpdateHospitalDto } from './dto/update-hospital.dto.js';

@ApiTags('Hospital')
@Controller('hospital')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

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
      storage: diskStorage({
        destination: './uploads/hospitals',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `hosp-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiResponse({
    status: 201,
    description: 'The hospital has been successfully created.',
  })
  create(
    @Body() createHospitalDto: CreateHospitalDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      createHospitalDto.logoUrl = `/uploads/hospitals/${file.filename}`;
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
      storage: diskStorage({
        destination: './uploads/hospitals',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `hosp-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHospitalDto: UpdateHospitalDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      updateHospitalDto.logoUrl = `/uploads/hospitals/${file.filename}`;
    }
    return this.hospitalService.update(id, updateHospitalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a hospital' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hospitalService.remove(id);
  }
}
