/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalibrationSetting } from './calibration-setting.entity';
import { CalibrationSettingService } from './calibration-setting.service';
import { CalibrationSettingController } from './calibration-setting.controller';

import { StandardToolCategory } from '../standard-tool/standard-tool-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalibrationSetting, StandardToolCategory]),
  ],
  providers: [CalibrationSettingService],
  controllers: [CalibrationSettingController],
  exports: [CalibrationSettingService],
})
export class CalibrationSettingModule {}
