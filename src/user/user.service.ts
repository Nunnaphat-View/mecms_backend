import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity.js';
import { Role } from '../role/role.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserSpecialty } from './user-specialty.entity.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSpecialty)
    private readonly userSpecialtyRepository: Repository<UserSpecialty>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['role', 'specialties'],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'specialties'],
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['role', 'specialties'],
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.findByUsername(createUserDto.username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const saved = await this.userRepository.save(user);
    return this.findOne(saved.id);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    Object.assign(user, updateUserDto);

    if (updateUserDto.roleId !== undefined) {
      user.role = { id: updateUserDto.roleId } as Role;
    }
    await this.userRepository.save(user);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async updateSpecialties(
    userId: number,
    toolNames: string[],
  ): Promise<UserSpecialty[]> {
    // Verify user exists first
    await this.findOne(userId);

    return this.dataSource.transaction(async (entityManager) => {
      // 1. Delete existing specialties
      await entityManager.delete(UserSpecialty, { userId });

      // 2. Insert new specialties if provided
      if (toolNames && toolNames.length > 0) {
        const specialtiesToSave = toolNames.map((name) => {
          const specialty = new UserSpecialty();
          specialty.userId = userId;
          specialty.toolName = name;
          return specialty;
        });
        await entityManager.save(UserSpecialty, specialtiesToSave);
      }

      // 3. Return updated list
      return entityManager.find(UserSpecialty, {
        where: { userId },
      });
    });
  }

  async getSpecialties(userId: number): Promise<UserSpecialty[]> {
    await this.findOne(userId);
    return this.userSpecialtyRepository.find({
      where: { userId },
    });
  }
}
