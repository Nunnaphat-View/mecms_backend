import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, ILike } from 'typeorm';
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
    @InjectRepository(SettingTool)
    private readonly settingToolRepo: Repository<SettingTool>,
  ) {}

  async findAll() {
    const settings = await this.repository.find({
      order: { id: 'ASC' },
    });

    const settingTools = await this.settingToolRepo.find({
      relations: ['standardTool'],
    });

    const toolsMap = new Map<string, StandardTool[]>();
    for (const st of settingTools) {
      if (st.standardTool && st.tool_name) {
        const key = st.tool_name.trim().toLowerCase();
        const list = toolsMap.get(key) || [];
        list.push(st.standardTool);
        toolsMap.set(key, list);
      }
    }

    return settings.map((s) => {
      const key = (s.tool_name || '').trim().toLowerCase();
      s.standardTools = toolsMap.get(key) || [];
      return s;
    });
  }

  async findByEquipment(toolName: string) {
    const trimmedToolName = (toolName || '').trim();
    const settings = await this.repository.find({
      where: { tool_name: ILike(trimmedToolName) },
      order: { id: 'ASC' },
    });

    const settingTools = await this.settingToolRepo.find({
      where: { tool_name: ILike(trimmedToolName) },
      relations: ['standardTool'],
    });

    const standardTools = settingTools
      ? settingTools.map((st) => st.standardTool).filter(Boolean)
      : [];

    return settings.map((s) => {
      s.standardTools = standardTools;
      return s;
    });
  }

  async batchSave(toolName: string, dtos: CreateCalibrationSettingDto[]) {
    const trimmedToolName = (toolName || '').trim();
    console.log(
      `Saving batch settings for ${trimmedToolName}:`,
      JSON.stringify(dtos, null, 2),
    );

    // 1. Delete existing settings and setting tools for this toolName case-insensitively
    await this.repository.delete({ tool_name: ILike(trimmedToolName) });
    await this.settingToolRepo.delete({ tool_name: ILike(trimmedToolName) });

    // 2. Collect unique standard tool IDs from the dtos
    const allToolIds = new Set<number>();
    for (const dto of dtos) {
      if (dto.standard_tool_ids && dto.standard_tool_ids.length > 0) {
        dto.standard_tool_ids.forEach((id) => allToolIds.add(id));
      }
    }

    // 3. Save new setting tools for this toolName
    const settingToolsToSave = Array.from(allToolIds).map((toolId) => {
      const relation = new SettingTool();
      relation.tool_name = toolName;
      relation.standard_tool_id = toolId;
      return relation;
    });

    if (settingToolsToSave.length > 0) {
      await this.settingToolRepo.save(settingToolsToSave);
    }

    // 4. Save new settings / parameters
    const savedEntities: CalibrationSetting[] = [];

    for (const dto of dtos) {
      const entity = this.repository.create({
        ...dto,
        parameter_name: dto.parameter_name ?? null,
        tool_name: toolName,
      });

      const saved = await this.repository.save(entity);
      savedEntities.push(saved);
    }

    // 5. Load standard tools for the return entities
    const standardTools =
      allToolIds.size > 0
        ? await this.standardToolRepo.find({
            where: { id: In(Array.from(allToolIds)) },
          })
        : [];

    for (const saved of savedEntities) {
      saved.standardTools = standardTools;
    }

    return savedEntities;
  }

  async deleteByEquipment(toolName: string) {
    const trimmedToolName = (toolName || '').trim();
    await this.settingToolRepo.delete({ tool_name: ILike(trimmedToolName) });
    return this.repository.delete({ tool_name: ILike(trimmedToolName) });
  }
}
