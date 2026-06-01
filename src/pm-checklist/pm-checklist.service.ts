/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChecklistCategory } from './entities/checklist-category.entity.js';
import { ChecklistItem } from './entities/checklist-item.entity.js';
import { PmChecklistResult } from './entities/pm-checklist-result.entity.js';
import { PmCategoryRemark } from './entities/pm-category-remark.entity.js';
import { SavePmFormDto } from './dto/save-pm-form.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { Equipment, EquipmentStatus } from '../equipment/equipment.entity.js';
import { Task, TaskStatus } from '../task/task.entity.js';

@Injectable()
export class PmChecklistService {
  constructor(
    @InjectRepository(ChecklistCategory)
    private readonly categoryRepo: Repository<ChecklistCategory>,

    @InjectRepository(ChecklistItem)
    private readonly itemRepo: Repository<ChecklistItem>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    private readonly dataSource: DataSource,
  ) {}

  // equipmentId is reserved for future filtering by equipment type
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPmForm(_equipmentId: number): Promise<ChecklistCategory[]> {
    return this.categoryRepo.find({
      order: { display_order: 'ASC', items: { display_order: 'ASC' } },
    });
  }

  async savePmForm(
    dto: SavePmFormDto,
  ): Promise<{ success: boolean; task_id: number }> {
    await this.dataSource.transaction(async (manager) => {
      const task = await manager.findOne(Task, {
        where: { id: dto.task_id },
        relations: ['technician'],
      });
      if (!task) {
        throw new NotFoundException(`Task #${dto.task_id} not found`);
      }

      // Fetch current checklist items for snapshotting
      const dbItems = await manager.find(ChecklistItem);
      const itemMap = new Map<number, ChecklistItem>();
      for (const item of dbItems) {
        itemMap.set(item.id, item);
      }

      // Freeze technician info if not already frozen or on every re-save
      if (task.technician) {
        const tech = task.technician;
        task.certificate_data = {
          ...task.certificate_data,
          technician: {
            name: tech.name,
            signatureUrl: tech.signatureUrl,
          },
        };
        console.log(`[DEBUG-PM] Frozen Tech: ${tech.name}`);
      }

      // Remove previous results and remarks for idempotency
      await manager.delete(PmChecklistResult, { task_id: dto.task_id });
      await manager.delete(PmCategoryRemark, { task_id: dto.task_id });

      // Insert new checklist results
      const results = dto.results.map((r) =>
        manager.create(PmChecklistResult, {
          task_id: dto.task_id,
          item_id: r.item_id,
          status: r.status,
        }),
      );
      await manager.save(PmChecklistResult, results);

      // Create PM checklist snapshot inside task.certificate_data.pmChecklist
      const snapshot = dto.results.map((r) => {
        const dbItem = itemMap.get(r.item_id);
        return {
          item_id: r.item_id,
          description: dbItem ? dbItem.description : '',
          category_id: dbItem ? dbItem.category_id : 0,
          display_order: dbItem ? dbItem.display_order : 0,
          status: r.status,
        };
      });

      task.certificate_data = {
        ...task.certificate_data,
        pmChecklist: snapshot,
      };

      // Insert remarks (skip empty text)
      const remarks = dto.remarks
        .filter((r) => r.text !== undefined)
        .map((r) =>
          manager.create(PmCategoryRemark, {
            task_id: dto.task_id,
            category_id: r.category_id,
            text: r.text ?? '',
          }),
        );
      if (remarks.length > 0) {
        await manager.save(PmCategoryRemark, remarks);
      }

      // Update the task record
      task.overall_result = dto.overall_result;
      // If the tech saves PM checklist, we keep it as InProgress, not Done
      // Done should only be set when the full calibration is submitted
      task.status = (
        dto.status === 'Done' ? 'InProgress' : dto.status
      ) as TaskStatus;
      if (dto.status === 'Done' && dto.path_pdf_pm) {
        task.path_pdf_pm = dto.path_pdf_pm;
      }
      await manager.save(Task, task);

      // Update Equipment status based on inspection result
      if (task.equipment_id) {
        const finalEqStatus: EquipmentStatus =
          dto.overall_result === 'Fail' ? 'repair' : 'calibrating';

        console.log('[PM-SAVE] Task ID:', task.id);
        console.log('[PM-SAVE] Overall Result:', dto.overall_result);
        console.log('[PM-SAVE] New Eq Status:', finalEqStatus);

        const equipment = await manager.findOne(Equipment, {
          where: { id: task.equipment_id },
        });

        if (equipment) {
          console.log('[PM-SAVE] Eq ID:', equipment.id);
          console.log('[PM-SAVE] Old Eq Status:', equipment.status);
          equipment.status = finalEqStatus;
          const savedEq = await manager.save(Equipment, equipment);
          console.log('[PM-SAVE] Updated Eq Status:', savedEq.status);
        }
      }
    });

    return { success: true, task_id: dto.task_id };
  }

  getCategories(): Promise<ChecklistCategory[]> {
    return this.categoryRepo.find({
      order: { display_order: 'ASC', items: { display_order: 'ASC' } },
    });
  }

  createCategory(dto: CreateCategoryDto): Promise<ChecklistCategory> {
    const category = this.categoryRepo.create({
      name: dto.name,
      display_order: dto.display_order ?? 0,
    });
    return this.categoryRepo.save(category);
  }

  async updateCategory(
    id: number,
    dto: UpdateCategoryDto,
  ): Promise<ChecklistCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: number): Promise<{ success: boolean }> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    await this.categoryRepo.remove(category);
    return { success: true };
  }

  getItems(categoryId?: number): Promise<ChecklistItem[]> {
    return this.itemRepo.find({
      where: categoryId ? { category_id: categoryId } : undefined,
      order: { category_id: 'ASC', display_order: 'ASC' },
    });
  }

  async createItem(dto: CreateItemDto): Promise<ChecklistItem> {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.category_id },
    });
    if (!category) {
      throw new NotFoundException(`Category #${dto.category_id} not found`);
    }
    const item = this.itemRepo.create({
      category_id: dto.category_id,
      description: dto.description,
      display_order: dto.display_order ?? 0,
    });
    return this.itemRepo.save(item);
  }

  async updateItem(id: number, dto: UpdateItemDto): Promise<ChecklistItem> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`ChecklistItem #${id} not found`);
    }
    if (dto.category_id !== undefined) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.category_id },
      });
      if (!category) {
        throw new NotFoundException(`Category #${dto.category_id} not found`);
      }
    }
    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async deleteItem(id: number): Promise<{ success: boolean }> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`ChecklistItem #${id} not found`);
    }
    await this.itemRepo.remove(item);
    return { success: true };
  }
}
