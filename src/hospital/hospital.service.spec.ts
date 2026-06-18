/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { HospitalService } from './hospital.service.js';
import { Hospital } from './entities/hospital.entity.js';

describe('HospitalService', () => {
  let service: HospitalService;
  let repository: jest.Mocked<Repository<Hospital>>;

  const mockHospital = {
    id: 1,
    name: 'Mock Hospital',
    description: 'A mock hospital for testing',
    address: '123 Test Road',
    code: 'H01',
    logoUrl: 'http://example.com/logo.png',
    zipCode: '10110',
    district: 'Klong Toei',
    province: 'Bangkok',
    sections: [],
    users: [],
  } as unknown as Hospital;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospitalService,
        {
          provide: getRepositoryToken(Hospital),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HospitalService>(HospitalService);
    repository = module.get(getRepositoryToken(Hospital));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a hospital', async () => {
      const createDto = {
        name: 'Mock Hospital',
        code: 'H01',
      };
      repository.create.mockReturnValue(mockHospital);
      repository.save.mockResolvedValue(mockHospital);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockHospital);
      expect(result).toEqual(mockHospital);
    });
  });

  describe('findAll', () => {
    it('should return an array of hospitals', async () => {
      repository.find.mockResolvedValue([mockHospital]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({ relations: ['sections'] });
      expect(result).toEqual([mockHospital]);
    });
  });

  describe('findOne', () => {
    it('should return a hospital if found', async () => {
      repository.findOne.mockResolvedValue(mockHospital);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['sections'],
      });
      expect(result).toEqual(mockHospital);
    });

    it('should throw NotFoundException if hospital is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['sections'],
      });
    });
  });

  describe('update', () => {
    it('should update and save a hospital', async () => {
      repository.findOne.mockResolvedValue(mockHospital);
      repository.save.mockResolvedValue(mockHospital);

      const updateDto = { name: 'Updated Hospital Name' };
      const result = await service.update(1, updateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['sections'],
      });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockHospital,
          name: 'Updated Hospital Name',
        }),
      );
      expect(result).toEqual(mockHospital);
    });
  });

  describe('remove', () => {
    it('should remove a hospital', async () => {
      repository.findOne.mockResolvedValue(mockHospital);
      repository.remove.mockResolvedValue(mockHospital);

      await service.remove(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['sections'],
      });
      expect(repository.remove).toHaveBeenCalledWith(mockHospital);
    });
  });
});
