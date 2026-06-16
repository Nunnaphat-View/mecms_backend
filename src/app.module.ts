import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RoleModule } from './role/role.module.js';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EquipmentModule } from './equipment/equipment.module.js';
import { TaskModule } from './task/task.module.js';
import { PmChecklistModule } from './pm-checklist/pm-checklist.module.js';
import { StandardToolModule } from './standard-tool/standard-tool.module.js';
import { HospitalModule } from './hospital/hospital.module.js';
import { SectionModule } from './section/section.module.js';
import { CalibrationProcessModule } from './calibration-process/calibration-process.module.js';
import { CalibrationCostModule } from './calibration-cost/calibration-cost.module.js';
import { LineModule } from './line/line.module.js';
import { NotificationModule } from './notification/notification.module.js';
import { CalibrationSettingModule } from './calibration-setting/calibration-setting.module.js';
import { AuditLogModule } from './audit-log/audit-log.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<'postgres' | 'mysql'>('DB_TYPE', 'postgres'),
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
      }),
      inject: [ConfigService],
    }),
    RoleModule,
    UserModule,
    AuthModule,
    EquipmentModule,
    TaskModule,
    PmChecklistModule,
    StandardToolModule,
    HospitalModule,
    SectionModule,
    CalibrationProcessModule,
    CalibrationCostModule,
    LineModule,
    NotificationModule,
    CalibrationSettingModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
