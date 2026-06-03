/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StandardTool } from './standard-tool.entity.js';
import { StandardToolService } from './standard-tool.service.js';
import { StandardToolController } from './standard-tool.controller.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([StandardTool]), StorageModule],
  controllers: [StandardToolController],
  providers: [StandardToolService],
  exports: [TypeOrmModule, StandardToolService],
})
export class StandardToolModule {}
