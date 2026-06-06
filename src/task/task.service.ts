/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, Brackets } from 'typeorm';
import { Task } from './task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { SubmitTaskDto } from './dto/submit-task.dto.js';
import { ApproveTaskDto } from './dto/approve-task.dto.js';
import { StandardTool } from '../standard-tool/standard-tool.entity.js';
import { Environment } from './entities/environment.entity.js';
import { Measurement } from './entities/measurement.entity.js';
import { Qualitative } from './entities/qualitative.entity.js';
import { SpecificParameter } from './entities/specific-parameter.entity.js';
import { Equipment, EquipmentStatus } from '../equipment/equipment.entity.js';
import { EquipmentService } from '../equipment/equipment.service.js';
import { LineService } from '../line/line.service.js';
import { User } from '../user/user.entity.js';
import { StandardDetail } from './entities/standard-detail.entity.js';
import { Hospital } from '../hospital/entities/hospital.entity.js';
import { Section } from '../section/entities/section.entity.js';
import { UserSpecialty } from '../user/user-specialty.entity.js';
import { GeminiService } from '../gemini/gemini.service.js';

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
    @InjectRepository(StandardDetail)
    private readonly standardDetailRepo: Repository<StandardDetail>,
    private readonly dataSource: DataSource,
    private readonly geminiService: GeminiService,
  ) {}

  async findAll(): Promise<Task[]> {
    const tasks = await this.taskRepo.find({
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
        'standardDetails',
        'standardDetails.standardTool',
        'checklistResults',
        'checklistResults.item',
        'checklistRemarks',
        'checklistRemarks.category',
        'specificParameters',
      ],
      order: { id: 'DESC' },
    });
    return tasks.map((task) => {
      task.standardTools = task.standardDetails
        ? task.standardDetails.map((sd) => sd.standardTool).filter(Boolean)
        : [];
      return task;
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
        'standardDetails',
        'standardDetails.standardTool',
        'checklistResults',
        'checklistResults.item',
        'checklistRemarks',
        'checklistRemarks.category',
        'specificParameters',
      ],
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    task.standardTools = task.standardDetails
      ? task.standardDetails.map((sd) => sd.standardTool).filter(Boolean)
      : [];
    return task;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const year = new Date().getFullYear();

    // ค้นหา cal_no ล่าสุดของปีนี้
    const lastTask = await this.taskRepo
      .createQueryBuilder('task')
      .where('task.cal_no LIKE :prefix', { prefix: `CAL-${year}-%` })
      .orderBy('task.cal_no', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastTask && lastTask.cal_no) {
      const parts = lastTask.cal_no.split('-');
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }

    const cal_no = `CAL-${year}-${String(nextNumber).padStart(4, '0')}`;

    const task = this.taskRepo.create({
      equipment_id: dto.equipment_id,
      technician_id: dto.technician_id,
      status: 'Pending',
      cal_no,
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
          'standardDetails',
          'standardDetails.standardTool',
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
        // Clear old ones first to prevent duplicates (since it's a junction table)
        await this.standardDetailRepo.delete({ task_id: id });

        if (dto.standard_tool_ids.length > 0) {
          task.standardDetails = dto.standard_tool_ids.map((toolId) => {
            const detail = new StandardDetail();
            detail.standard_tool_id = toolId;
            return detail;
          });
        } else {
          task.standardDetails = [];
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

      if (dto.standard_tool_ids && dto.standard_tool_ids.length > 0) {
        finalTask.standardTools = await this.standardToolRepo.find({
          where: { id: In(dto.standard_tool_ids) },
        });
      } else {
        finalTask.standardTools = [];
      }

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

  async rescheduleTasksToDate(
    taskIds: number[],
    newDate: string,
  ): Promise<Task[]> {
    const targetDate = new Date(newDate);

    const tasks = await this.taskRepo.find({
      where: taskIds.map((id) => ({ id })),
      relations: ['equipment', 'equipment.section', 'technician'],
    });

    if (tasks.length === 0) {
      throw new NotFoundException('ไม่พบงานสอบเทียบที่ระบุ');
    }

    await this.dataSource.transaction(async (entityManager) => {
      for (const task of tasks) {
        if (task.equipment) {
          task.equipment.calibration_due_date = targetDate;
          await entityManager.save(Equipment, task.equipment);
        }
      }
    });

    return tasks;
  }

  async autoAssignTasksForMonth(month: number, year: number): Promise<Task[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const tasks = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.equipment', 'equipment')
      .leftJoinAndSelect('equipment.section', 'section')
      .leftJoinAndSelect('task.technician', 'technician')
      .where('task.status = :status', { status: 'Pending' })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            'equipment.calibration_due_date BETWEEN :startDate AND :endDate',
            { startDate, endDate },
          ).orWhere(
            'equipment.calibration_due_date IS NULL AND task.createdAt BETWEEN :startDate AND :endDate',
            { startDate, endDate },
          );
        }),
      )
      .getMany();

    if (tasks.length === 0) {
      return [];
    }

    const technicians = await this.userRepo.find({
      where: { roleId: 2 },
      relations: ['specialties'],
    });

    if (technicians.length === 0) {
      throw new BadRequestException('No technicians found in the system');
    }

    const workloads: { [techId: number]: number } = {};
    for (const tech of technicians) {
      workloads[tech.id] = 0;
    }

    const getCandidates = (task: Task) => {
      const toolName = task.equipment?.tool_name;
      if (!toolName) return technicians;
      const matched = technicians.filter((tech) =>
        tech.specialties?.some(
          (spec) => spec.toolName.toLowerCase() === toolName.toLowerCase(),
        ),
      );
      return matched.length > 0 ? matched : technicians;
    };

    const sectionGroups: { [key: number]: Task[] } = {};
    const noSectionTasks: Task[] = [];
    for (const task of tasks) {
      const secId = task.equipment?.sectionId;
      if (secId) {
        if (!sectionGroups[secId]) sectionGroups[secId] = [];
        sectionGroups[secId].push(task);
      } else {
        noSectionTasks.push(task);
      }
    }

    const sectionAssignments: { [sectionId: number]: number } = {};

    const sortedSectionIds = Object.keys(sectionGroups)
      .map(Number)
      .sort((a, b) => sectionGroups[b].length - sectionGroups[a].length);

    const assignTask = (task: Task, sectionId?: number) => {
      const candidates = getCandidates(task);
      let selectedTech = candidates[0];

      if (sectionId && sectionAssignments[sectionId]) {
        const existingSectionTechId = sectionAssignments[sectionId];
        const found = candidates.find((c) => c.id === existingSectionTechId);
        if (found) {
          selectedTech = found;
        } else {
          selectedTech = candidates.reduce(
            (min, curr) =>
              workloads[curr.id] < workloads[min.id] ? curr : min,
            candidates[0],
          );
        }
      } else {
        selectedTech = candidates.reduce(
          (min, curr) => (workloads[curr.id] < workloads[min.id] ? curr : min),
          candidates[0],
        );
      }

      task.technician_id = selectedTech.id;
      task.technician = selectedTech;
      workloads[selectedTech.id]++;
      if (sectionId) {
        sectionAssignments[sectionId] = selectedTech.id;
      }
    };

    for (const secId of sortedSectionIds) {
      const groupTasks = sectionGroups[secId];
      for (const task of groupTasks) {
        assignTask(task, secId);
      }
    }

    for (const task of noSectionTasks) {
      assignTask(task);
    }

    // Distribute tasks across month days (grouping tasks in same section to the same day)
    const daysInMonth = new Date(year, month, 0).getDate();
    let dayCounter = 1;

    for (const secId of sortedSectionIds) {
      const groupTasks = sectionGroups[secId];
      for (const task of groupTasks) {
        if (task.equipment) {
          const targetDay = dayCounter;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
          task.equipment.calibration_due_date = new Date(dateStr);
        }
      }
      dayCounter = (dayCounter % daysInMonth) + 1;
    }

    for (const task of noSectionTasks) {
      if (task.equipment) {
        const targetDay = dayCounter;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
        task.equipment.calibration_due_date = new Date(dateStr);
        dayCounter = (dayCounter % daysInMonth) + 1;
      }
    }

    // Save in transaction
    await this.dataSource.transaction(async (entityManager) => {
      for (const task of tasks) {
        await entityManager.save(Task, task);
        if (task.equipment) {
          await entityManager.save(Equipment, task.equipment);
        }
      }
    });

    return tasks;
  }

  async publishTasksForMonth(month: number, year: number): Promise<Task[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const tasks = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.equipment', 'equipment')
      .leftJoinAndSelect('equipment.section', 'section')
      .leftJoinAndSelect('task.technician', 'technician')
      .where('task.status = :status', { status: 'Pending' })
      .andWhere('task.technician_id IS NOT NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            'equipment.calibration_due_date BETWEEN :startDate AND :endDate',
            { startDate, endDate },
          ).orWhere(
            'equipment.calibration_due_date IS NULL AND task.createdAt BETWEEN :startDate AND :endDate',
            { startDate, endDate },
          );
        }),
      )
      .getMany();

    if (tasks.length === 0) {
      return [];
    }

    await this.dataSource.transaction(async (entityManager) => {
      for (const task of tasks) {
        task.status = 'InProgress';
        await entityManager.save(Task, task);
      }
    });

    return tasks;
  }

  async assignTechnicianToTask(
    taskId: number,
    technicianId: number,
  ): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['equipment', 'equipment.section', 'technician'],
    });
    if (!task) {
      throw new NotFoundException(`Task #${taskId} not found`);
    }

    const technician = await this.userRepo.findOne({
      where: { id: technicianId, roleId: 2 },
    });
    if (!technician) {
      throw new NotFoundException(`Technician #${technicianId} not found`);
    }

    task.technician_id = technicianId;
    task.technician = technician;

    return this.taskRepo.save(task);
  }

  async seedTestData(): Promise<{ message: string }> {
    await this.dataSource.transaction(async (entityManager) => {
      // 1. Get or create a default hospital
      let hospital = await entityManager.findOne(Hospital, { where: {} });
      if (!hospital) {
        hospital = new Hospital();
        hospital.name = 'โรงพยาบาลทดสอบ';
        hospital.address = '123 ถนนทดสอบ';
        hospital.district = 'เมือง';
        hospital.province = 'กรุงเทพฯ';
        hospital.zipCode = '10100';
        hospital = await entityManager.save(Hospital, hospital);
      }

      // 2. Get or create default sections (ER, ICU, IPD, OPD)
      const sectionNames = ['ER', 'ICU', 'IPD', 'OPD'];
      const sections: Record<string, Section> = {};
      for (const name of sectionNames) {
        let sec = await entityManager.findOne(Section, { where: { name } });
        if (!sec) {
          sec = new Section();
          sec.name = name;
          sec.hospital = hospital;
          sec = await entityManager.save(Section, sec);
        }
        sections[name] = sec;
      }

      // 3. Find or create 3 technicians with specialties
      let tech1 = await entityManager.findOne(User, {
        where: { username: 'somchai' },
      });
      if (!tech1) {
        tech1 = new User();
        tech1.username = 'somchai';
        tech1.name = 'ช่างสมชาย (Defib, Infusion)';
        tech1.password =
          '$2b$10$tM3V.9qjUeQWpA7e6u3RquVf2V5oN7r2g/1o2c3d4e5f6g7h8i9j'; // hashed "password"
        tech1.roleId = 2;
        tech1.hospital = hospital;
        tech1 = await entityManager.save(User, tech1);
      }

      let tech2 = await entityManager.findOne(User, {
        where: { username: 'somying' },
      });
      if (!tech2) {
        tech2 = new User();
        tech2.username = 'somying';
        tech2.name = 'ช่างสมหญิง (ECG, Infusion)';
        tech2.password =
          '$2b$10$tM3V.9qjUeQWpA7e6u3RquVf2V5oN7r2g/1o2c3d4e5f6g7h8i9j';
        tech2.roleId = 2;
        tech2.hospital = hospital;
        tech2 = await entityManager.save(User, tech2);
      }

      let tech3 = await entityManager.findOne(User, {
        where: { username: 'somsak' },
      });
      if (!tech3) {
        tech3 = new User();
        tech3.username = 'somsak';
        tech3.name = 'ช่างสมศักดิ์ (Defib, Pressure)';
        tech3.password =
          '$2b$10$tM3V.9qjUeQWpA7e6u3RquVf2V5oN7r2g/1o2c3d4e5f6g7h8i9j';
        tech3.roleId = 2;
        tech3.hospital = hospital;
        tech3 = await entityManager.save(User, tech3);
      }

      // Refresh specialties
      await entityManager.delete(UserSpecialty, { userId: tech1.id });
      await entityManager.delete(UserSpecialty, { userId: tech2.id });
      await entityManager.delete(UserSpecialty, { userId: tech3.id });

      const specs = [
        { tech: tech1, tools: ['Defibrillator', 'Infusion Pump'] },
        { tech: tech2, tools: ['ECG Monitor', 'Infusion Pump'] },
        { tech: tech3, tools: ['Defibrillator', 'Pressure Gauge'] },
      ];

      for (const spec of specs) {
        for (const tool of spec.tools) {
          const us = new UserSpecialty();
          us.userId = spec.tech.id;
          us.toolName = tool;
          await entityManager.save(UserSpecialty, us);
        }
      }

      // 4. Create 9 medical equipments with due date in June 15, 2026
      const equipmentsData = [
        { name: 'Defibrillator', code: 'BME-DF-001', section: 'ER' },
        { name: 'Defibrillator', code: 'BME-DF-002', section: 'ER' },
        { name: 'Defibrillator', code: 'BME-DF-003', section: 'ICU' },
        { name: 'Infusion Pump', code: 'BME-IP-001', section: 'ICU' },
        { name: 'Infusion Pump', code: 'BME-IP-002', section: 'ICU' },
        { name: 'Infusion Pump', code: 'BME-IP-003', section: 'IPD' },
        { name: 'ECG Monitor', code: 'BME-ECG-001', section: 'ER' },
        { name: 'ECG Monitor', code: 'BME-ECG-002', section: 'ER' },
        { name: 'Pressure Gauge', code: 'BME-PG-001', section: 'OPD' },
      ];

      for (const eqData of equipmentsData) {
        let eq = await entityManager.findOne(Equipment, {
          where: { asset_code: eqData.code },
        });
        if (eq) {
          const oldTasks = await entityManager.find(Task, {
            where: { equipment_id: eq.id },
          });
          for (const t of oldTasks) {
            await entityManager.delete(Task, t.id);
          }
        } else {
          eq = new Equipment();
        }

        eq.tool_name = eqData.name;
        eq.asset_code = eqData.code;
        eq.status = 'ready';
        eq.calibration_due_date = new Date('2026-06-15');
        eq.section = sections[eqData.section];
        eq = await entityManager.save(Equipment, eq);

        const year = 2026;
        const count = await entityManager.count(Task, { where: {} });
        const cal_no = `CAL-${year}-${String(count + 1).padStart(4, '0')}`;

        const task = new Task();
        task.equipment_id = eq.id;
        task.cal_no = cal_no;
        task.status = 'Pending';
        task.technician_id = null as any;
        await entityManager.save(Task, task);
      }
    });

    return { message: 'Seed data generated successfully for June 2026!' };
  }

  async analyzeScheduleForMonth(
    month: number,
    year: number,
  ): Promise<{ analysis: string }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const tasks = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.equipment', 'equipment')
      .leftJoinAndSelect('equipment.section', 'section')
      .leftJoinAndSelect('task.technician', 'technician')
      .where(
        new Brackets((qb) => {
          qb.where(
            'equipment.calibration_due_date BETWEEN :startDate AND :endDate',
            { startDate, endDate },
          ).orWhere(
            'equipment.calibration_due_date IS NULL AND task.createdAt BETWEEN :startDate AND :endDate',
            { startDate, endDate },
          );
        }),
      )
      .getMany();

    if (tasks.length === 0) {
      return {
        analysis: 'ไม่มีรายการงานสอบเทียบในเดือนและปีที่เลือก จึงไม่มีข้อมูลสำหรับการวิเคราะห์แผนงาน',
      };
    }

    const totalTasks = tasks.length;
    const unassignedCount = tasks.filter((t) => !t.technician_id).length;

    const statusCounts: Record<string, number> = {};
    const techWorkloads: Record<string, number> = {};
    const sectionWorkloads: Record<string, number> = {};
    const dayWorkloads: Record<number, number> = {};

    for (const task of tasks) {
      const status = task.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const techName = task.technician?.name || 'ยังไม่ได้มอบหมาย';
      techWorkloads[techName] = (techWorkloads[techName] || 0) + 1;

      const sectionName = task.equipment?.section?.name || 'ไม่มีแผนก';
      sectionWorkloads[sectionName] = (sectionWorkloads[sectionName] || 0) + 1;

      const date = task.equipment?.calibration_due_date;
      if (date) {
        const day = new Date(date).getDate();
        dayWorkloads[day] = (dayWorkloads[day] || 0) + 1;
      }
    }

    const sortedDays = Object.entries(dayWorkloads)
      .map(([day, count]) => ({ day: Number(day), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const prompt = `คุณคือ AI ผู้ช่วยหัวหน้าแผนกตรวจสอบตารางงานสอบเทียบเครื่องมือแพทย์ในโรงพยาบาล
หน้าที่ของคุณคือวิเคราะห์ข้อมูลสถิติแผนงานสอบเทียบประจำเดือน ${month}/${year} และเขียนบทวิเคราะห์เป็นภาษาไทยในรูปแบบ Markdown (.md) ที่กระชับ ได้ใจความ และเป็นมืออาชีพตามสไตล์ Clean Industrial (เน้นข้อมูลจริง ห้ามใช้สัญลักษณ์หรืออิโมจิใด ๆ ในบทวิเคราะห์เด็ดขาด เช่น 💡, ⚠️, ✅ หรืออื่น ๆ เพื่อให้รายงานตารางงานดูสะอาดตาและเป็นทางการ)

ข้อมูลดิบของตารางงานประจำเดือน:
- จำนวนงานสอบเทียบทั้งหมด: ${totalTasks} งาน
- จำนวนงานที่ยังไม่ได้มอบหมายช่าง: ${unassignedCount} งาน
- สถานะงาน: ${JSON.stringify(statusCounts)}
- ภาระงานรายช่าง (จำนวนงานที่ช่างแต่ละคนได้รับ): ${JSON.stringify(techWorkloads)}
- ภาระงานรายแผนก (จำนวนงานของแต่ละแผนก): ${JSON.stringify(sectionWorkloads)}
- วันที่งานกระจุกตัวหนาแน่นที่สุด (Top Busy Days): ${JSON.stringify(sortedDays)}

คำแนะนำในการเขียนสรุป:
1. วิเคราะห์ความสมดุลของภาระงานรายช่าง (Workload Balance): มีช่างคนไหนได้งานเยอะเกินไป (เช่น เกิน 25 งานต่อเดือน) หรือน้อยเกินไปหรือไม่ และให้คำแนะนำ
2. วิเคราะห์ความคุ้มค่าของการทำงาน (Section Continuity): มีงานแผนกไหนกระจุกตัว และการมอบหมายช่างเป็นอย่างไร (เช่น การมอบหมายให้ช่างคนเดียวกันในแผนกเดียวกันเพื่อลดการสลับพื้นที่ทำงาน)
3. วิเคราะห์ความเสี่ยงรายวัน (Daily Concentration): มีวันไหนงานแน่นเกินไปที่ช่างจะทำไหวหรือไม่ (เช่น วันไหนงานเกิน 10 งานสำหรับช่างทั้งหมด)
4. สรุปภาพรวมสั้นๆ ว่าตารางนี้พร้อมสำหรับเผยแพร่ (Publish) หรือควรมีการปรับปรุงเปลี่ยนวัน/เปลี่ยนช่างก่อน

เขียนบทวิเคราะห์ทั้งหมดในภาษาไทย โดยไม่ต้องมีคำเกริ่นนำหรือคำส่งท้ายยาว ๆ ให้แสดงผลเป็นหัวข้อ Markdown ที่พร้อมเรนเดอร์ใน UI ทันที`;

    const analysis = await this.geminiService.generateContent(prompt);
    return { analysis };
  }
}
