/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { User } from '../user/user.entity.js';
import { Role } from '../role/role.entity.js';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let auditLogService: jest.Mocked<AuditLogService>;

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
    const mockUserService = {
      create: jest.fn(),
      findByUsername: jest.fn(),
      findOne: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockAuditLogService = {
      createLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    auditLogService = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user and return user info with token', async () => {
      const registerDto = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        name: 'Test User',
        tel: '0812345678',
        roleId: 1,
      };

      userService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mocked_jwt_token');
      auditLogService.createLog.mockResolvedValue(undefined as any);

      const result = await authService.register(
        registerDto,
        '127.0.0.1',
        'TestAgent',
      );

      expect(userService.create).toHaveBeenCalledWith(registerDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
      expect(auditLogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          action: 'AUTH_REGISTER',
          resourceName: 'User',
          resourceId: String(mockUser.id),
        }),
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
        access_token: 'mocked_jwt_token',
      });
    });
  });

  describe('login', () => {
    const loginDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should successfully login and return access token when credentials are valid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userService.findByUsername.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mocked_jwt_token');
      auditLogService.createLog.mockResolvedValue(undefined as any);

      const result = await authService.login(
        loginDto,
        '127.0.0.1',
        'TestAgent',
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(
        loginDto.username,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(auditLogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          action: 'AUTH_LOGIN',
        }),
      );
      expect(result.access_token).toBe('mocked_jwt_token');
      expect(result.user.username).toBe(mockUser.username);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      userService.findByUsername.mockResolvedValue(null);
      auditLogService.createLog.mockResolvedValue(undefined as any);

      await expect(
        authService.login(loginDto, '127.0.0.1', 'TestAgent'),
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.findByUsername).toHaveBeenCalledWith(
        loginDto.username,
      );
      expect(auditLogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
          action: 'AUTH_LOGIN_FAILED',
          newValues: expect.objectContaining({ reason: 'User not found' }),
        }),
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      userService.findByUsername.mockResolvedValue(mockUser);
      auditLogService.createLog.mockResolvedValue(undefined as any);

      await expect(
        authService.login(loginDto, '127.0.0.1', 'TestAgent'),
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.findByUsername).toHaveBeenCalledWith(
        loginDto.username,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(auditLogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          action: 'AUTH_LOGIN_FAILED',
          newValues: expect.objectContaining({ reason: 'Invalid password' }),
        }),
      );
    });
  });

  describe('getProfile', () => {
    it('should return user info without password', async () => {
      userService.findOne.mockResolvedValue(mockUser);

      const result = await authService.getProfile(mockUser.id);

      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result).not.toHaveProperty('password');
      expect(result.username).toBe(mockUser.username);
      expect(result.email).toBe(mockUser.email);
    });
  });
});
