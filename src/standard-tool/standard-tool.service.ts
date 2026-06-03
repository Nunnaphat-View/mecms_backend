import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StandardTool } from './standard-tool.entity.js';
import { CreateStandardToolDto } from './dto/create-standard-tool.dto.js';
import { UpdateStandardToolDto } from './dto/update-standard-tool.dto.js';

@Injectable()
export class StandardToolService {
  constructor(
    @InjectRepository(StandardTool)
    private readonly standardToolRepo: Repository<StandardTool>,
  ) {}

  findAll(): Promise<StandardTool[]> {
    return this.standardToolRepo.find({
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<StandardTool> {
    const tool = await this.standardToolRepo.findOne({ where: { id } });
    if (!tool) {
      throw new NotFoundException(`Standard Tool #${id} not found`);
    }
    return tool;
  }

  create(dto: CreateStandardToolDto): Promise<StandardTool> {
    const tool = this.standardToolRepo.create(dto);
    return this.standardToolRepo.save(tool);
  }

  async update(id: number, dto: UpdateStandardToolDto): Promise<StandardTool> {
    const tool = await this.findOne(id);
    Object.assign(tool, dto);
    return this.standardToolRepo.save(tool);
  }

  async remove(id: number): Promise<void> {
    const tool = await this.findOne(id);
    await this.standardToolRepo.remove(tool);
  }

  async updatePdfPath(id: number, pathPdf: string): Promise<StandardTool> {
    const tool = await this.findOne(id);
    tool.path_pdf = pathPdf;
    return this.standardToolRepo.save(tool);
  }

  async updateImagePath(id: number, pathImage: string): Promise<StandardTool> {
    const tool = await this.findOne(id);
    tool.path_image = pathImage;
    return this.standardToolRepo.save(tool);
  }
}
