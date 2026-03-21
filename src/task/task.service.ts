/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task } from './task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { SubmitTaskDto } from './dto/submit-task.dto.js';
import { ApproveTaskDto } from './dto/approve-task.dto.js';
import { StandardTool } from '../standard-tool/standard-tool.entity.js';
import { Environment } from './entities/environment.entity.js';
import { Measurement } from './entities/measurement.entity.js';
import { Qualitative } from './entities/qualitative.entity.js';
import { SpecificParameter } from './entities/specific-parameter.entity.js';
import { EquipmentService } from '../equipment/equipment.service.js';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(StandardTool)
    private readonly standardToolRepo: Repository<StandardTool>,
    @InjectRepository(Environment)
    private readonly environmentRepo: Repository<Environment>,
    @InjectRepository(Measurement)
    private readonly measurementRepo: Repository<Measurement>,
    @InjectRepository(Qualitative)
    private readonly qualitativeRepo: Repository<Qualitative>,
    @InjectRepository(SpecificParameter)
    private readonly specificParameterRepo: Repository<SpecificParameter>,
    private readonly equipmentService: EquipmentService,
  ) {}

  findAll(): Promise<Task[]> {
    return this.taskRepo.find({
      relations: [
        'technician',
        'equipment',
        'equipment.equipmentType',
        'equipment.section',
        'equipment.section.hospital',
        'approver',
        'environments',
        'measurements',
        'qualitatives',
        'standardTools',
        'checklistResults',
        'checklistResults.item',
        'checklistRemarks',
        'checklistRemarks.category',
        'specificParameters',
      ],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: [
        'technician',
        'equipment',
        'equipment.equipmentType',
        'equipment.section',
        'equipment.section.hospital',
        'approver',
        'environments',
        'measurements',
        'qualitatives',
        'standardTools',
        'checklistResults',
        'checklistResults.item',
        'checklistRemarks',
        'checklistRemarks.category',
        'specificParameters',
      ],
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const year = new Date().getFullYear();
    const count = await this.taskRepo.count();
    const pm_no = `PM-${year}-${String(count + 1).padStart(4, '0')}`;

    const task = this.taskRepo.create({
      equipment_id: dto.equipment_id,
      task_user: dto.task_user,
      status: 'Pending',
      pm_no,
    });
    return this.taskRepo.save(task);
  }

  async submitTask(id: number, dto: SubmitTaskDto): Promise<Task> {
    console.log(`=== Submitting task ${id} ===`);
    try {
      // Load task WITHOUT the child relations (environments/measurements/qualitatives)
      // If TypeORM never loads those arrays, it CANNOT cascade-nullify them later
      const task = await this.taskRepo.findOne({
        where: { id },
        relations: ['equipment', 'standardTools'],
      });
      if (!task) throw new NotFoundException(`Task #${id} not found`);
      console.log(`Task found: id=${task.id}`);

      // 0. Clear old data from DB
      await this.environmentRepo.delete({ task_id: id });
      await this.measurementRepo.delete({ task_id: id });
      await this.qualitativeRepo.delete({ task_id: id });
      await this.specificParameterRepo.delete({ task_id: id });
      console.log('Old data cleared');

      // 1. Save Environment - use task object so TypeORM sets the FK correctly
      if (
        dto.ambient_temp !== undefined ||
        dto.ambient_humidity !== undefined
      ) {
        const env = new Environment();
        env.ambient_temp = dto.ambient_temp ?? 0;
        env.ambient_humidity = dto.ambient_humidity ?? 0;
        env.task = task;
        await this.environmentRepo.save(env);
        console.log('Environment saved');
      }

      // 2. Save Measurements - use task object so TypeORM sets the FK correctly
      if (dto.measurements && dto.measurements.length > 0) {
        for (const m of dto.measurements) {
          const measurement = new Measurement();
          measurement.parameter_name = m.parameter_name;
          measurement.range = m.range ?? 0;
          measurement.standard_value = m.standard_value ?? 0;
          measurement.reading_1 = m.reading_1 ?? 0;
          measurement.reading_2 = m.reading_2 ?? 0;
          measurement.reading_3 = m.reading_3 ?? 0;
          measurement.average_value = m.average_value ?? 0;
          measurement.error_value = m.error_value ?? 0;
          measurement.result = m.result;
          measurement.display_type = m.display_type ?? null;
          measurement.resolution = m.resolution ?? null;
          measurement.task = task;
          await this.measurementRepo.save(measurement);
        }
        console.log(`${dto.measurements.length} measurements saved`);
      }

      // 3. Save Qualitatives - use task object so TypeORM sets the FK correctly
      if (dto.qualitatives && dto.qualitatives.length > 0) {
        for (const q of dto.qualitatives) {
          const qualitative = new Qualitative();
          qualitative.parameter_name = q.parameter_name ?? null;
          qualitative.item_name = q.item_name;
          qualitative.result = q.result;
          qualitative.task = task;
          await this.qualitativeRepo.save(qualitative);
        }
        console.log(`${dto.qualitatives.length} qualitatives saved`);
      }

      // 4. Save Specific Parameters
      if (dto.specific_parameters && dto.specific_parameters.length > 0) {
        for (const sp of dto.specific_parameters) {
          const specificParam = new SpecificParameter();
          specificParam.name = sp.name;
          specificParam.value = sp.value ?? null;
          specificParam.unit = sp.unit ?? null;
          specificParam.task = task;
          await this.specificParameterRepo.save(specificParam);
        }
        console.log(
          `${dto.specific_parameters.length} specific parameters saved`,
        );
      }

      // 5. Link Standard Tools
      if (dto.standard_tool_ids && dto.standard_tool_ids.length > 0) {
        const standardTools = await this.standardToolRepo.findBy({
          id: In(dto.standard_tool_ids),
        });
        task.standardTools = standardTools;
      }

      task.overall_result = dto.overall_result;
      task.status = 'PendingApproval';

      if (task.equipment_id) {
        await this.equipmentService.update(task.equipment_id, {
          status: 'inactive',
        } as any);
      }

      const finalTask = await this.taskRepo.save(task);
      console.log('=== Task submitted successfully ===');
      return finalTask;
    } catch (error) {
      console.error('Submit Task Error:', error);
      throw error;
    }
  }

  async approveTask(id: number, dto: ApproveTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (dto.decision === 'Approve') {
      task.status = 'Approved';
      task.approver_id = dto.approver_id;
      task.remarks = dto.remarks;

      if (task.equipment_id) {
        const finalStatus =
          task.overall_result === 'Pass' ? 'active' : 'inactive';
        await this.equipmentService.update(task.equipment_id, {
          status: finalStatus,
        } as any);
      }
    } else {
      task.status = 'Rejected';
      task.approver_id = dto.approver_id;
      task.remarks = dto.remarks;
    }

    return this.taskRepo.save(task);
  }
}
