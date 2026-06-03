import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CalibrationSetting } from './calibration-setting.entity';
import { CreateCalibrationSettingDto } from './dto/create-calibration-setting.dto';
import { StandardTool } from '../standard-tool/standard-tool.entity';

import { SettingTool } from './setting-tool.entity';

@Injectable()
export class CalibrationSettingService {
  constructor(
    @InjectRepository(CalibrationSetting)
    private readonly repository: Repository<CalibrationSetting>,
    @InjectRepository(StandardTool)
    private readonly standardToolRepo: Repository<StandardTool>,
  ) {}

  async findAll() {
    const settings = await this.repository.find({
      relations: ['settingTools', 'settingTools.standardTool'],
      order: { id: 'ASC' },
    });
    return settings.map((s) => {
      s.standardTools = s.settingTools
        ? s.settingTools.map((st) => st.standardTool).filter(Boolean)
        : [];
      return s;
    });
  }

  async findByEquipment(toolName: string) {
    const settings = await this.repository.find({
      where: { tool_name: toolName },
      relations: ['settingTools', 'settingTools.standardTool'],
      order: { id: 'ASC' },
    });
    return settings.map((s) => {
      s.standardTools = s.settingTools
        ? s.settingTools.map((st) => st.standardTool).filter(Boolean)
        : [];
      return s;
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
        entity.settingTools = dto.standard_tool_ids.map((toolId) => {
          const relation = new SettingTool();
          relation.standard_tool_id = toolId;
          return relation;
        });
      } else {
        entity.settingTools = [];
      }

      const saved = await this.repository.save(entity);

      if (dto.standard_tool_ids && dto.standard_tool_ids.length > 0) {
        saved.standardTools = await this.standardToolRepo.find({
          where: { id: In(dto.standard_tool_ids) },
        });
      } else {
        saved.standardTools = [];
      }

      savedEntities.push(saved);
    }

    return savedEntities;
  }

  async deleteByEquipment(toolName: string) {
    return this.repository.delete({ tool_name: toolName });
  }
}
