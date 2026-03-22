import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistCategory } from './entities/checklist-category.entity.js';
import { ChecklistItem } from './entities/checklist-item.entity.js';
import { PmChecklistResult } from './entities/pm-checklist-result.entity.js';
import { PmCategoryRemark } from './entities/pm-category-remark.entity.js';
import { Equipment } from '../equipment/equipment.entity.js';
import { TaskModule } from '../task/task.module.js';
import { PmChecklistService } from './pm-checklist.service.js';
import { PmChecklistController } from './pm-checklist.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChecklistCategory,
      ChecklistItem,
      PmChecklistResult,
      PmCategoryRemark,
      Equipment,
    ]),
    TaskModule,
  ],
  controllers: [PmChecklistController],
  providers: [PmChecklistService],
})
export class PmChecklistModule {}
