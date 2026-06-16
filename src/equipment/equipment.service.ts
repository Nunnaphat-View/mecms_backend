/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from './equipment.entity.js';
import { Task } from '../task/task.entity.js';
import { CreateEquipmentDto } from './dto/create-equipment.dto.js';
import { UpdateEquipmentDto } from './dto/update-equipment.dto.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly auditLogService: AuditLogService,
  ) {}

  findAll(): Promise<Equipment[]> {
    return this.equipmentRepo.find({
      relations: ['equipmentType', 'section', 'section.hospital'],
      order: { id: 'DESC' },
    });
  }

  findOne(id: number): Promise<Equipment | null> {
    return this.equipmentRepo.findOne({
      where: { id },
      relations: ['equipmentType', 'section', 'section.hospital'],
    });
  }

  async getPublicStatus(identifier: string | number) {
    let equipment: Equipment | null = null;

    // Check if identifier is a number or a numeric string
    const numericId = Number(identifier);

    if (!isNaN(numericId) && typeof identifier !== 'symbol') {
      equipment = await this.findOne(numericId);
    } else if (typeof identifier === 'string') {
      equipment = await this.equipmentRepo.findOne({
        where: { asset_code: identifier },
        relations: ['equipmentType', 'section', 'section.hospital'],
      });
    }

    if (!equipment) {
      throw new NotFoundException(`Equipment #${identifier} not found`);
    }

    const id = equipment.id;

    // Latest Approved Task
    const latestTask = await this.taskRepo.findOne({
      where: { equipment_id: id, status: 'Approved' },
      relations: ['technician'],
      order: { id: 'DESC' },
    });

    // History (Approved Tasks)
    const history = await this.taskRepo.find({
      where: { equipment_id: id, status: 'Approved' },
      relations: ['technician'],
      order: { id: 'DESC' },
      take: 10,
    });

    return {
      equipment,
      latestTask,
      history,
    };
  }

  async create(
    dto: CreateEquipmentDto,
    currentUser?: { userId: number; ip?: string; userAgent?: string },
  ): Promise<Equipment> {
    const equipment = this.equipmentRepo.create(dto);
    const saved = await this.equipmentRepo.save(equipment);
    const result = await this.findOne(saved.id);

    if (currentUser) {
      await this.auditLogService.createLog({
        userId: currentUser.userId,
        action: 'EQUIPMENT_CREATE',
        resourceName: 'Equipment',
        resourceId: String(saved.id),
        oldValues: null,
        newValues: result,
        ipAddress: currentUser.ip,
        userAgent: currentUser.userAgent,
      });
    }

    return result as Equipment;
  }

  async update(
    id: number,
    dto: UpdateEquipmentDto,
    currentUser?: { userId: number; ip?: string; userAgent?: string },
  ): Promise<Equipment> {
    const equipment = await this.findOne(id);
    if (!equipment) {
      throw new NotFoundException(`Equipment #${id} not found`);
    }

    const oldValues = { ...equipment };

    if (dto.equipment_type_id !== undefined) {
      delete (equipment as any).equipmentType;
    }

    if (dto.sectionId !== undefined) {
      delete (equipment as any).section;
    }

    Object.assign(equipment, dto);
    await this.equipmentRepo.save(equipment);
    const result = await this.findOne(id);

    if (currentUser) {
      await this.auditLogService.createLog({
        userId: currentUser.userId,
        action: 'EQUIPMENT_UPDATE',
        resourceName: 'Equipment',
        resourceId: String(id),
        oldValues,
        newValues: result,
        ipAddress: currentUser.ip,
        userAgent: currentUser.userAgent,
      });
    }

    return result as Equipment;
  }

  async remove(
    id: number,
    currentUser?: { userId: number; ip?: string; userAgent?: string },
  ): Promise<void> {
    const equipment = await this.findOne(id);
    if (!equipment) {
      throw new NotFoundException(`Equipment #${id} not found`);
    }
    const oldValues = { ...equipment };
    await this.equipmentRepo.softRemove(equipment);

    if (currentUser) {
      await this.auditLogService.createLog({
        userId: currentUser.userId,
        action: 'EQUIPMENT_DELETE',
        resourceName: 'Equipment',
        resourceId: String(id),
        oldValues,
        newValues: null,
        ipAddress: currentUser.ip,
        userAgent: currentUser.userAgent,
      });
    }
  }

  async getUniqueToolNames(): Promise<string[]> {
    const results = await this.equipmentRepo
      .createQueryBuilder('equipment')
      .select('DISTINCT equipment.tool_name', 'tool_name')
      .orderBy('equipment.tool_name', 'ASC')
      .getRawMany();
    return results.map((r) => r.tool_name as string).filter(Boolean);
  }
}
