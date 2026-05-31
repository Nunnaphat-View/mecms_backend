/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CalibrationSettingService } from './calibration-setting.service';
import { CreateCalibrationSettingDto } from './dto/create-calibration-setting.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Calibration Settings')
@Controller('calibration-setting')
@UseGuards(AuthGuard('jwt'))
export class CalibrationSettingController {
  constructor(private readonly service: CalibrationSettingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all calibration settings' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':equipmentName')
  @ApiOperation({ summary: 'Get settings for a specific equipment' })
  findByEquipment(@Param('equipmentName') equipmentName: string) {
    return this.service.findByEquipment(equipmentName);
  }

  @Post('batch/:equipmentName')
  @ApiOperation({
    summary: 'Save batch of calibration settings for an equipment',
  })
  batchSave(
    @Param('equipmentName') equipmentName: string,
    @Body() dtos: CreateCalibrationSettingDto[],
  ) {
    return this.service.batchSave(equipmentName, dtos);
  }

  @Delete(':equipmentName')
  @ApiOperation({ summary: 'Delete all settings for an equipment' })
  deleteByEquipment(@Param('equipmentName') equipmentName: string) {
    return this.service.deleteByEquipment(equipmentName);
  }
}
