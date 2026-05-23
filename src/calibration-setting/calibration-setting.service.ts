/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CalibrationSetting } from './calibration-setting.entity';
import { CreateCalibrationSettingDto } from './dto/create-calibration-setting.dto';
import { StandardToolCategory } from '../standard-tool/standard-tool-category.entity';

@Injectable()
export class CalibrationSettingService {
  constructor(
    @InjectRepository(CalibrationSetting)
    private readonly repository: Repository<CalibrationSetting>,
    @InjectRepository(StandardToolCategory)
    private readonly categoryRepo: Repository<StandardToolCategory>,
  ) {}

  async findAll() {
    return this.repository.find({ relations: ['categories'] });
  }

  async findByEquipment(equipmentName: string) {
    return this.repository.find({
      where: { equipment_name: equipmentName },
      relations: ['categories'],
    });
  }

  async batchSave(equipmentName: string, dtos: CreateCalibrationSettingDto[]) {
    console.log(`Saving batch settings for ${equipmentName}:`, JSON.stringify(dtos, null, 2));
    
    // 1. Delete existing settings for this equipment
    await this.repository.delete({ equipment_name: equipmentName });

    // 2. Save new settings
    const savedEntities: CalibrationSetting[] = [];
    
    for (const dto of dtos) {
      const entity = this.repository.create({
        ...dto,
        parameter_name: dto.parameter_name ?? null,
        equipment_name: equipmentName,
      });

      if (dto.category_ids && dto.category_ids.length > 0) {
        entity.categories = await this.categoryRepo.find({
          where: { id: In(dto.category_ids) }
        });
      } else {
        entity.categories = [];
      }

      savedEntities.push(await this.repository.save(entity));
    }

    return savedEntities;
  }

  async deleteByEquipment(equipmentName: string) {
    return this.repository.delete({ equipment_name: equipmentName });
  }
}
