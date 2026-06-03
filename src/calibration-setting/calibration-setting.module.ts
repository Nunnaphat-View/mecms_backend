import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalibrationSetting } from './calibration-setting.entity';
import { CalibrationSettingService } from './calibration-setting.service';
import { CalibrationSettingController } from './calibration-setting.controller';
import { StandardTool } from '../standard-tool/standard-tool.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CalibrationSetting, StandardTool])],
  providers: [CalibrationSettingService],
  controllers: [CalibrationSettingController],
  exports: [CalibrationSettingService],
})
export class CalibrationSettingModule {}
