import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity.js';
import { TaskService } from './task.service.js';
import { TaskController } from './task.controller.js';
import { StandardTool } from '../standard-tool/standard-tool.entity.js';
import { Environment } from './entities/environment.entity.js';
import { Measurement } from './entities/measurement.entity.js';
import { Qualitative } from './entities/qualitative.entity.js';
import { SpecificParameter } from './entities/specific-parameter.entity.js';
import { User } from '../user/user.entity.js';
import { EquipmentModule } from '../equipment/equipment.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { StandardDetail } from './entities/standard-detail.entity.js';
import { GeminiModule } from '../gemini/gemini.module.js';
import { TaskCertificate } from './entities/task-certificate.entity.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      StandardTool,
      Environment,
      Measurement,
      Qualitative,
      SpecificParameter,
      User,
      StandardDetail,
      TaskCertificate,
    ]),
    EquipmentModule,
    StorageModule,
    GeminiModule,
    AuditLogModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TypeOrmModule, TaskService],
})
export class TaskModule {}
