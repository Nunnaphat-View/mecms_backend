/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { SubmitTaskDto } from './dto/submit-task.dto.js';
import { ApproveTaskDto } from './dto/approve-task.dto.js';
import { StandardTool } from '../standard-tool/standard-tool.entity.js';
import { Environment } from './entities/environment.entity.js';
import { Measurement } from './entities/measurement.entity.js';
import { Qualitative } from './entities/qualitative.entity.js';
import { SpecificParameter } from './entities/specific-parameter.entity.js';
import { EquipmentStatus } from '../equipment/equipment.entity.js';
import { EquipmentService } from '../equipment/equipment.service.js';
import { LineService } from '../line/line.service.js';
import { User } from '../user/user.entity.js';

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
    private readonly lineService: LineService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findAll(): Promise<Task[]> {
    return this.taskRepo.find({
      relations: [
        'technician',
        'technician.hospital',
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
        'technician.hospital',
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

    // ค้นหา pm_no ล่าสุดของปีนี้
    const lastTask = await this.taskRepo
      .createQueryBuilder('task')
      .where('task.pm_no LIKE :prefix', { prefix: `PM-${year}-%` })
      .orderBy('task.pm_no', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastTask && lastTask.pm_no) {
      const parts = lastTask.pm_no.split('-');
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }

    const pm_no = `PM-${year}-${String(nextNumber).padStart(4, '0')}`;

    const task = this.taskRepo.create({
      equipment_id: dto.equipment_id,
      task_user: dto.task_user,
      status: 'Pending',
      pm_no,
    });
    const saved = await this.taskRepo.save(task);

    return saved;
  }

  async submitTask(id: number, dto: SubmitTaskDto): Promise<Task> {
    const fs = require('fs');
    fs.appendFileSync(
      'submit_debug.log',
      `\n[${new Date().toISOString()}] Task ${id} DTO: ${JSON.stringify(dto)}\n`,
    );
    console.log(`=== Submitting task ${id} ===`);
    try {
      // Load task WITHOUT the child relations (environments/measurements/qualitatives)
      // If TypeORM never loads those arrays, it CANNOT cascade-nullify them later
      const task = await this.taskRepo.findOne({
        where: { id },
        relations: [
          'equipment',
          'equipment.section',
          'equipment.section.hospital',
          'standardTools',
          'technician',
          'technician.hospital',
        ],
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
          measurement.parameter_name = m.parameter_name ?? null;
          measurement.result = m.result;
          measurement.display_type = m.display_type ?? null;
          measurement.resolution = m.resolution ?? null;
          measurement.std_type = m.std_type ?? null;
          measurement.task = task;

          // Pack numeric results into JSONB data column
          measurement.data = {
            range: m.range ?? 0,
            standard_value: m.standard_value ?? 0,
            reading_1: m.reading_1 ?? null,
            reading_2: m.reading_2 ?? null,
            reading_3: m.reading_3 ?? null,
            average_value: m.average_value ?? 0,
            error_value: m.error_value ?? 0,
            std_reading_1: m.std_reading_1 ?? null,
            std_reading_2: m.std_reading_2 ?? null,
            std_reading_3: m.std_reading_3 ?? null,
            average_standard: m.average_standard ?? null,
          };

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
      if (dto.standard_tool_ids) {
        console.log(
          `Explicitly linking tools for task ${id}:`,
          dto.standard_tool_ids,
        );
        if (dto.standard_tool_ids.length > 0) {
          const tools = await this.standardToolRepo.find({
            where: { id: In(dto.standard_tool_ids) },
          });
          task.standardTools = tools;
        } else {
          task.standardTools = [];
        }
      }

      // Create unified snapshot in JSONB while preserving existing fields (like pmChecklist)
      const targetHospital =
        task.technician?.hospital || task.equipment?.section?.hospital;
      const currentCertData = task.certificate_data || {};
      task.certificate_data = {
        ...currentCertData,
        hospital: targetHospital
          ? {
              name: targetHospital.name,
              logoUrl: targetHospital.logoUrl,
              address: targetHospital.address,
              district: targetHospital.district,
              province: targetHospital.province,
              zipCode: targetHospital.zipCode,
            }
          : null,
        department: {
          name: task.equipment?.section?.name || null,
        },
        technician: task.technician
          ? {
              name: task.technician.name || '',
              signatureUrl: task.technician.signatureUrl,
            }
          : null,
      };

      task.overall_result = dto.overall_result;
      task.status = dto.status || 'PendingApproval';

      if (task.equipment_id) {
        const finalEqStatus =
          task.overall_result === 'Fail' ? 'disabled' : 'calibrating';
        await this.equipmentService.update(task.equipment_id, {
          status: finalEqStatus,
        } as any);
      }

      const finalTask = await this.taskRepo.save(task);
      console.log('=== Task submitted successfully ===');

      return finalTask;
    } catch (error) {
      console.error('Submit Task Error:', error);
      throw new BadRequestException(`Submit failed: ${error.message}`);
    }
  }

  async approveTask(id: number, dto: ApproveTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (dto.decision === 'Approve') {
      task.status = 'Approved';
      task.approver_id = dto.approver_id;
      task.approvedAt = new Date();
      task.remarks = dto.remarks;

      // Freeze approver info into certificate_data
      const approverFetch = await this.userRepo.findOne({
        where: { id: dto.approver_id },
      });

      const currentCertData = { ...(task.certificate_data || {}) };

      if (approverFetch) {
        currentCertData.approver = {
          name: approverFetch.name,
          signatureUrl: approverFetch.signatureUrl,
        };
      }

      // Safety: also freeze technician and hospital info if missing (for legacy tasks being approved now)
      if (!currentCertData.technician && task.technician) {
        currentCertData.technician = {
          name: task.technician.name,
          signatureUrl: task.technician.signatureUrl,
        };
      }

      if (!currentCertData.hospital) {
        const targetHospital =
          task.technician?.hospital || task.equipment?.section?.hospital;
        if (targetHospital) {
          currentCertData.hospital = {
            name: targetHospital.name,
            logoUrl: targetHospital.logoUrl,
            address: targetHospital.address,
            district: targetHospital.district,
            province: targetHospital.province,
            zipCode: targetHospital.zipCode,
          };
        }
        if (task.equipment?.section) {
          currentCertData.department = { name: task.equipment.section.name };
        }
      }

      task.certificate_data = currentCertData;

      if (task.equipment_id) {
        const equipment = await this.equipmentService.findOne(
          task.equipment_id,
        );
        if (equipment) {
          const isPass = task.overall_result === 'Pass';
          const finalStatus = isPass ? 'ready' : 'disabled';
          interface EquipmentUpdate {
            status: EquipmentStatus;
            calibration_date_last?: string;
            calibration_due_date?: string;
          }
          const updateData: EquipmentUpdate = { status: finalStatus };

          if (isPass) {
            // Update last calibration date to today
            const now = new Date();
            updateData.calibration_date_last = now.toISOString().split('T')[0];

            // Calculate next due date
            if (equipment.interval) {
              const nextDate = new Date(now);
              nextDate.setMonth(nextDate.getMonth() + equipment.interval);
              updateData.calibration_due_date = nextDate
                .toISOString()
                .split('T')[0];
            }
          }

          await this.equipmentService.update(task.equipment_id, updateData);
        }
      }
    } else {
      task.status = 'ReCalibrate';
      task.approver_id = dto.approver_id;
      task.remarks = dto.remarks;

      if (task.equipment_id) {
        await this.equipmentService.update(task.equipment_id, {
          status: 'calibrating',
        } as any);
      }
    }

    const savedTask = await this.taskRepo.save(task);

    // Notify technician about the decision
    return savedTask;
  }

  async updateCerPath(id: number, path: string): Promise<Task> {
    const task = await this.findOne(id);
    task.path_pdf_cer = path;
    return this.taskRepo.save(task);
  }
}
