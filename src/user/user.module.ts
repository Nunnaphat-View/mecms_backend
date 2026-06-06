import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity.js';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { UserSpecialty } from './user-specialty.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSpecialty])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
