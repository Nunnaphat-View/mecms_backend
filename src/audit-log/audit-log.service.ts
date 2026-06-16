import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity.js';
import { User } from '../user/user.entity.js';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createLog(
    logData: Partial<AuditLog>,
    entityManager?: EntityManager,
  ): Promise<AuditLog> {
    const cleanedOld = this.sanitizeSensitiveData(logData.oldValues || null);
    const cleanedNew = this.sanitizeSensitiveData(logData.newValues || null);

    const log = new AuditLog();
    Object.assign(log, {
      ...logData,
      oldValues: cleanedOld,
      newValues: cleanedNew,
    });

    // Automatically resolve actorName and actorRole if they aren't provided but userId is present
    if (log.userId && (!log.actorName || !log.actorRole)) {
      const userRepo = entityManager
        ? entityManager.getRepository(User)
        : this.userRepository;
      const user = await userRepo.findOne({
        where: { id: log.userId },
        relations: ['role'],
      });
      if (user) {
        log.actorName = user.name || user.username;
        log.actorRole = user.role?.name || 'User';
      }
    }

    // Default fallbacks if resolver failed or wasn't provided
    if (!log.actorName) log.actorName = 'System';
    if (!log.actorRole) log.actorRole = 'System';

    if (entityManager) {
      return entityManager.save(AuditLog, log);
    }
    return this.auditLogRepository.save(log);
  }

  async findAll(query: {
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      queryBuilder.andWhere(
        '(log.actorName ILIKE :search OR log.action ILIKE :search OR log.resourceName ILIKE :search)',
        { search: searchPattern },
      );
    }

    if (query.startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('log.createdAt <= :endDate', {
        endDate: end,
      });
    }

    queryBuilder.orderBy('log.createdAt', 'DESC');
    queryBuilder.skip(skip);
    queryBuilder.take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private sanitizeSensitiveData(
    data: Record<string, any> | null,
  ): Record<string, any> | null {
    if (!data) return null;
    const sensitiveKeys = [
      'password',
      'token',
      'access_token',
      'refresh_token',
      'secret',
    ];
    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = '[HIDDEN]';
      }
    }
    return sanitized;
  }
}
