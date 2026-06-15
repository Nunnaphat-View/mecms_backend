import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service.js';
import { NotificationController } from './notification.controller.js';
import { Equipment } from '../equipment/equipment.entity.js';
import { Task } from '../task/task.entity.js';
import { LineModule } from '../line/line.module.js';
import { NotificationLog } from './notification-log.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment, Task, NotificationLog]),
    LineModule,
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
