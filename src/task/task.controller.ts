/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../storage/storage.service.js';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TaskService } from './task.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { SubmitTaskDto } from './dto/submit-task.dto.js';
import { ApproveTaskDto } from './dto/approve-task.dto.js';
import { AutoAssignDto } from './dto/auto-assign.dto.js';
import { PublishTasksDto } from './dto/publish-tasks.dto.js';
import { AssignTechnicianDto } from './dto/assign-technician.dto.js';
import { RescheduleTasksDto } from './dto/reschedule-tasks.dto.js';

@ApiTags('Task')
@Controller('pm-task')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'ดูรายการ Task PM ทั้งหมด (Admin)' })
  @ApiResponse({ status: 200, description: 'คืนค่า Array of Task' })
  findAll() {
    return this.taskService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'เรียกดูข้อมูล Task รายอัน' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin สร้าง Task PM ใหม่และ assign ช่าง' })
  @ApiResponse({
    status: 201,
    description: 'Task ถูกสร้างสำเร็จ พร้อม task_id',
  })
  create(@Body() dto: CreateTaskDto, @Request() req: any) {
    return this.taskService.create(dto, req.user);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'ช่างส่งผลการสอบเทียบ' })
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitTaskDto,
    @Request() req: any,
  ) {
    return this.taskService.submitTask(id, dto, req.user);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'อนุมัติงาน PM' })
  approveTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveTaskDto,
    @Request() req: any,
  ) {
    return this.taskService.approveTask(id, dto, req.user);
  }

  @Post(':id/upload-cer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  @ApiOperation({ summary: 'อัปโหลดไฟล์ CER PDF' })
  async uploadCer(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileUrl = await this.storageService.uploadFile(file, 'certs');
    return this.taskService.updateCerPath(id, fileUrl);
  }

  @Post('auto-assign')
  @ApiOperation({ summary: 'AI จัดตารางงานมอบหมายช่างประจำเดือนอัตโนมัติ' })
  autoAssign(@Body() dto: AutoAssignDto) {
    return this.taskService.autoAssignTasksForMonth(dto.month, dto.year);
  }

  @Post('publish')
  @ApiOperation({ summary: 'เผยแพร่แผนงานสอบเทียบช่างประจำเดือน' })
  publish(@Body() dto: PublishTasksDto) {
    return this.taskService.publishTasksForMonth(dto.month, dto.year);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'มอบหมายช่างผู้รับผิดชอบด้วยตนเอง' })
  assignTechnician(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTechnicianDto,
    @Request() req: any,
  ) {
    return this.taskService.assignTechnicianToTask(
      id,
      dto.technician_id,
      req.user,
    );
  }

  @Post('seed')
  @ApiOperation({ summary: 'จำลองข้อมูลทดสอบสำหรับมิถุนายน 2569 (June 2026)' })
  seed() {
    return this.taskService.seedTestData();
  }

  @Patch('reschedule')
  @ApiOperation({ summary: 'ย้ายวันที่สอบเทียบของกลุ่มงาน (Drag & Drop)' })
  @ApiResponse({ status: 200, description: 'อัปเดตวันสอบเทียบสำเร็จ' })
  reschedule(@Body() dto: RescheduleTasksDto, @Request() req: any) {
    return this.taskService.rescheduleTasksToDate(
      dto.taskIds,
      dto.newDate,
      req.user,
    );
  }

  @Post('schedule/analyze')
  @ApiOperation({ summary: 'วิเคราะห์และสรุปแผนงานสอบเทียบโดย AI' })
  @ApiResponse({
    status: 200,
    description: 'บทวิเคราะห์สรุปแผนงานในรูปแบบ Markdown',
  })
  analyzeSchedule(@Body() dto: AutoAssignDto) {
    return this.taskService.analyzeScheduleForMonth(dto.month, dto.year);
  }
}
