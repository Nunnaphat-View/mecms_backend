import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from './equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
  ) {}

  findAll(): Promise<Equipment[]> {
    return this.equipmentRepo.find({
      relations: ['equipmentType'],
      order: { id: 'DESC' },
    });
  }

  findOne(id: number): Promise<Equipment | null> {
    return this.equipmentRepo.findOne({
      where: { id },
      relations: ['equipmentType'],
    });
  }

  async create(dto: CreateEquipmentDto): Promise<Equipment> {
    const equipment = this.equipmentRepo.create(dto);
    const saved = await this.equipmentRepo.save(equipment);
    return this.findOne(saved.id) as Promise<Equipment>;
  }

  async update(id: number, dto: UpdateEquipmentDto): Promise<Equipment> {
    const equipment = await this.findOne(id);
    if (!equipment) {
      throw new NotFoundException(`Equipment #${id} not found`);
    }

    // If equipment_type_id is being updated, clear the loaded relation
    // to force TypeORM to use the ID column
    if (dto.equipment_type_id !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete (equipment as any).equipmentType;
    }

    Object.assign(equipment, dto);
    await this.equipmentRepo.save(equipment);
    return this.findOne(id) as Promise<Equipment>;
  }

  async remove(id: number): Promise<void> {
    const equipment = await this.findOne(id);
    if (!equipment) {
      throw new NotFoundException(`Equipment #${id} not found`);
    }
    await this.equipmentRepo.softRemove(equipment);
  }
}
