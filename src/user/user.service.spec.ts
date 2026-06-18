/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service.js';
import { User } from './user.entity.js';
import { UserSpecialty } from './user-specialty.entity.js';
import { Role } from '../role/role.entity.js';

// Mock bcrypt module to avoid slow execution and ensure consistency
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
    email: 'test@example.com',
    name: 'Test User',
    tel: '0812345678',
    imageUrl: null,
    signatureUrl: null,
    role: { id: 1, name: 'Technician' } as Role,
    specialties: [],
  } as unknown as User;

  beforeEach(async () => {
    const mockUserRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockUserSpecialtyRepository = {
      find: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(UserSpecialty),
          useValue: mockUserSpecialtyRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      userRepository.find.mockResolvedValue([mockUser]);

      const result = await userService.findAll();

      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['role', 'specialties'],
      });
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.findOne(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['role', 'specialties'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(userService.findOne(999)).rejects.toThrow(NotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['role', 'specialties'],
      });
    });
  });

  describe('create', () => {
    const createUserDto = {
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      name: 'New User',
      tel: '0812345678',
      roleId: 1,
    };

    it('should successfully create a new user with hashed password', async () => {
      userRepository.findOne.mockResolvedValue(null); // No existing username
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      userRepository.findOne.mockImplementation((query: any) => {
        // Return null for findByUsername query during checks
        if (query.where?.username) return Promise.resolve(null);
        // Return mockUser for the final findOne(saved.id)
        if (query.where?.id === mockUser.id) return Promise.resolve(mockUser);
        return Promise.resolve(null);
      });

      const result = await userService.create(createUserDto);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: createUserDto.username,
          password: 'hashedpassword',
        }),
      );
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if username already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser); // Existing username found

      await expect(userService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should find and remove a user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.remove.mockResolvedValue(mockUser);

      await userService.remove(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['role', 'specialties'],
      });
      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('updateSpecialties', () => {
    it('should delete and save specialties inside a transaction', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const mockEntityManager = {
        delete: jest.fn().mockResolvedValue({}),
        save: jest.fn().mockResolvedValue([]),
        find: jest.fn().mockResolvedValue([{ userId: 1, toolName: 'Tool A' }]),
      } as unknown as EntityManager;

      dataSource.transaction.mockImplementation((cb: any) =>
        cb(mockEntityManager),
      );

      const result = await userService.updateSpecialties(1, ['Tool A']);

      expect(mockEntityManager.delete).toHaveBeenCalledWith(UserSpecialty, {
        userId: 1,
      });
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        UserSpecialty,
        expect.any(Array),
      );
      expect(mockEntityManager.find).toHaveBeenCalledWith(UserSpecialty, {
        where: { userId: 1 },
      });
      expect(result).toEqual([{ userId: 1, toolName: 'Tool A' }]);
    });
  });
});
