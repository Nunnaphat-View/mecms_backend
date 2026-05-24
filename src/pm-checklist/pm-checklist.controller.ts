import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PmChecklistService } from './pm-checklist.service.js';
import { SavePmFormDto } from './dto/save-pm-form.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';

@ApiTags('PM Checklist')
@Controller()
export class PmChecklistController {
  constructor(private readonly pmChecklistService: PmChecklistService) {}

  @Get('pm-form/:equipment_id')
  @ApiOperation({
    summary: 'ดึงโครงสร้าง Checklist (หมวดหมู่ + รายการตรวจ)',
  })
  @ApiParam({ name: 'equipment_id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'คืนค่า Array ของ ChecklistCategory พร้อม items[]',
  })
  getPmForm(@Param('equipment_id', ParseIntPipe) equipmentId: number) {
    return this.pmChecklistService.getPmForm(equipmentId);
  }

  @Post('pm-save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'บันทึกผล PM Checklist (ต้อง Login) — ทำงานใน Transaction เดียว',
  })
  @ApiResponse({ status: 201, description: 'บันทึกสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบ Task ที่ระบุ' })
  @ApiResponse({ status: 401, description: 'ไม่ได้ล็อกอิน' })
  savePmForm(@Body() dto: SavePmFormDto) {
    return this.pmChecklistService.savePmForm(dto);
  }

  // ── Category ──────────────────────────────────────────────────────────

  @Get('checklist-categories')
  @ApiOperation({ summary: 'ดูหมวดหมู่ทั้งหมด (พร้อม items)' })
  @ApiResponse({ status: 200, description: 'Array of ChecklistCategory' })
  getCategories() {
    return this.pmChecklistService.getCategories();
  }

  @Post('checklist-categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'เพิ่มหมวดหมู่ใหม่' })
  @ApiResponse({ status: 201, description: 'Category ที่สร้างสำเร็จ' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.pmChecklistService.createCategory(dto);
  }

  @Patch('checklist-categories/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'แก้ไขหมวดหมู่' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Category ที่แก้ไขสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบหมวดหมู่ที่ระบุ' })
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.pmChecklistService.updateCategory(id, dto);
  }

  @Delete('checklist-categories/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ลบหมวดหมู่' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบหมวดหมู่ที่ระบุ' })
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.pmChecklistService.deleteCategory(id);
  }

  // ── Item ──────────────────────────────────────────────────────────────

  @Get('checklist-items')
  @ApiOperation({ summary: 'ดูรายการตรวจทั้งหมด (กรอง category_id ได้)' })
  @ApiResponse({ status: 200, description: 'Array of ChecklistItem' })
  getItems(@Query('category_id') categoryId?: string) {
    const id = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.pmChecklistService.getItems(id);
  }

  @Post('checklist-items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'เพิ่มรายการตรวจใหม่' })
  @ApiResponse({ status: 201, description: 'Item ที่สร้างสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบหมวดหมู่ที่ระบุ' })
  createItem(@Body() dto: CreateItemDto) {
    return this.pmChecklistService.createItem(dto);
  }

  @Patch('checklist-items/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'แก้ไขรายการตรวจ' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Item ที่แก้ไขสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบรายการตรวจที่ระบุ' })
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
  ) {
    return this.pmChecklistService.updateItem(id, dto);
  }

  @Delete('checklist-items/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ลบรายการตรวจ' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบรายการตรวจที่ระบุ' })
  deleteItem(@Param('id', ParseIntPipe) id: number) {
    return this.pmChecklistService.deleteItem(id);
  }
}
