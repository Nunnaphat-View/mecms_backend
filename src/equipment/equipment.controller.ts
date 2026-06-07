import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { EquipmentService } from './equipment.service.js';
import { CreateEquipmentDto } from './dto/create-equipment.dto.js';
import { UpdateEquipmentDto } from './dto/update-equipment.dto.js';
import { Public } from '../auth/decorators/public.decorator.js';

@ApiTags('Equipment')
@Controller('equipment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Public()
  @Get('public-status/:id')
  @ApiOperation({ summary: 'ดูข้อมูลเครื่องมือแบบสาธารณะ (ผ่าน QR Code)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'คืนค่า Equipment Status & History',
  })
  async getPublicStatus(@Param('id') id: string) {
    return this.equipmentService.getPublicStatus(id);
  }

  @Get()
  @ApiOperation({ summary: 'ดูรายการเครื่องมือแพทย์ทั้งหมด' })
  @ApiResponse({ status: 200, description: 'คืนค่า Array of Equipment' })
  findAll() {
    return this.equipmentService.findAll();
  }

  @Get('tool-names')
  @ApiOperation({ summary: 'ดึงรายชื่อเครื่องมือทั้งหมดที่ไม่ซ้ำกัน' })
  @ApiResponse({ status: 200, description: 'คืนค่า Array of String' })
  getUniqueToolNames() {
    return this.equipmentService.getUniqueToolNames();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูเครื่องมือตาม ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'คืนค่า Equipment' })
  @ApiResponse({ status: 404, description: 'ไม่พบเครื่องมือ' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const equipment = await this.equipmentService.findOne(id);
    if (!equipment) {
      throw new NotFoundException(`Equipment #${id} not found`);
    }
    return equipment;
  }

  @Post()
  @ApiOperation({ summary: 'เพิ่มเครื่องมือใหม่' })
  @ApiResponse({ status: 201, description: 'เพิ่มเครื่องมือสำเร็จ' })
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลเครื่องมือ' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'แก้ไขสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบเครื่องมือ' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบเครื่องมือ' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบเครื่องมือ' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.equipmentService.remove(id);
    return { success: true };
  }
}
