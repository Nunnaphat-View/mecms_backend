/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SectionService } from './section.service.js';
import { Section } from './entities/section.entity.js';
import { Hospital } from '../hospital/entities/hospital.entity.js';

describe('SectionService', () => {
  let service: SectionService;
  let repository: jest.Mocked<Repository<Section>>;

  const mockHospital = {
    id: 1,
    name: 'Test Hospital',
  } as unknown as Hospital;

  const mockSection = {
    id: 1,
    name: 'Mock Section',
    code: 'SEC01',
    description: 'A mock section for testing',
    hospitalId: 1,
    hospital: mockHospital,
    equipments: [],
  } as unknown as Section;

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
        SectionService,
        {
          provide: getRepositoryToken(Section),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SectionService>(SectionService);
    repository = module.get(getRepositoryToken(Section));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a section', async () => {
      const createDto = {
        name: 'Mock Section',
        hospitalId: 1,
      };
      repository.create.mockReturnValue(mockSection);
      repository.save.mockResolvedValue(mockSection);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockSection);
      expect(result).toEqual(mockSection);
    });
  });

  describe('findAll', () => {
    it('should return an array of sections', async () => {
      repository.find.mockResolvedValue([mockSection]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({ relations: ['hospital'] });
      expect(result).toEqual([mockSection]);
    });
  });

  describe('findOne', () => {
    it('should return a section if found', async () => {
      repository.findOne.mockResolvedValue(mockSection);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['hospital'],
      });
      expect(result).toEqual(mockSection);
    });

    it('should throw NotFoundException if section is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['hospital'],
      });
    });
  });

  describe('update', () => {
    it('should update and save a section', async () => {
      repository.findOne.mockResolvedValue(mockSection);
      repository.save.mockResolvedValue(mockSection);

      const updateDto = { name: 'Updated Section Name' };
      const result = await service.update(1, updateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['hospital'],
      });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockSection,
          name: 'Updated Section Name',
        }),
      );
      expect(result).toEqual(mockSection);
    });
  });

  describe('remove', () => {
    it('should remove a section', async () => {
      repository.findOne.mockResolvedValue(mockSection);
      repository.remove.mockResolvedValue(mockSection);

      await service.remove(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['hospital'],
      });
      expect(repository.remove).toHaveBeenCalledWith(mockSection);
    });
  });

  describe('findByHospital', () => {
    it('should return sections belonging to a specific hospitalId', async () => {
      repository.find.mockResolvedValue([mockSection]);

      const result = await service.findByHospital(1);

      expect(repository.find).toHaveBeenCalledWith({
        where: { hospitalId: 1 },
      });
      expect(result).toEqual([mockSection]);
    });
  });
});
