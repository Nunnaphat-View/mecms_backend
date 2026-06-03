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

  @Get(':toolName')
  @ApiOperation({ summary: 'Get settings for a specific equipment' })
  findByEquipment(@Param('toolName') toolName: string) {
    return this.service.findByEquipment(toolName);
  }

  @Post('batch/:toolName')
  @ApiOperation({
    summary: 'Save batch of calibration settings for an equipment',
  })
  batchSave(
    @Param('toolName') toolName: string,
    @Body() dtos: CreateCalibrationSettingDto[],
  ) {
    return this.service.batchSave(toolName, dtos);
  }

  @Delete(':toolName')
  @ApiOperation({ summary: 'Delete all settings for an equipment' })
  deleteByEquipment(@Param('toolName') toolName: string) {
    return this.service.deleteByEquipment(toolName);
  }
}
