import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from './equipment.entity.js';
import { EquipmentType } from './equipment-type.entity.js';
import { Task } from '../task/task.entity.js';
import { EquipmentService } from './equipment.service.js';
import { EquipmentTypeService } from './equipment-type.service.js';
import { EquipmentController } from './equipment.controller.js';
import { EquipmentTypeController } from './equipment-type.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment, EquipmentType, Task]),
    AuditLogModule,
  ],
  controllers: [EquipmentController, EquipmentTypeController],
  providers: [EquipmentService, EquipmentTypeService],
  exports: [EquipmentService, EquipmentTypeService],
})
export class EquipmentModule {}
