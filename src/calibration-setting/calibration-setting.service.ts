import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CalibrationSetting } from './calibration-setting.entity';
import { CreateCalibrationSettingDto } from './dto/create-calibration-setting.dto';
import { StandardTool } from '../standard-tool/standard-tool.entity';

@Injectable()
export class CalibrationSettingService {
  constructor(
    @InjectRepository(CalibrationSetting)
    private readonly repository: Repository<CalibrationSetting>,
    @InjectRepository(StandardTool)
    private readonly standardToolRepo: Repository<StandardTool>,
  ) {}

  async findAll() {
    return this.repository.find({
      relations: ['standardTools'],
      order: { id: 'ASC' },
    });
  }

  async findByEquipment(toolName: string) {
    return this.repository.find({
      where: { tool_name: toolName },
      relations: ['standardTools'],
      order: { id: 'ASC' },
    });
  }

  async batchSave(toolName: string, dtos: CreateCalibrationSettingDto[]) {
    console.log(
      `Saving batch settings for ${toolName}:`,
      JSON.stringify(dtos, null, 2),
    );

    // 1. Delete existing settings for this equipment
    await this.repository.delete({ tool_name: toolName });

    // 2. Save new settings
    const savedEntities: CalibrationSetting[] = [];

    for (const dto of dtos) {
      const entity = this.repository.create({
        ...dto,
        parameter_name: dto.parameter_name ?? null,
        tool_name: toolName,
      });

      if (dto.standard_tool_ids && dto.standard_tool_ids.length > 0) {
        entity.standardTools = await this.standardToolRepo.find({
          where: { id: In(dto.standard_tool_ids) },
        });
      } else {
        entity.standardTools = [];
      }

      savedEntities.push(await this.repository.save(entity));
    }

    return savedEntities;
  }

  async deleteByEquipment(toolName: string) {
    return this.repository.delete({ tool_name: toolName });
  }
}
