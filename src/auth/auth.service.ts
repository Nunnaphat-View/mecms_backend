/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async register(registerDto: RegisterDto, ip?: string, userAgent?: string) {
    const user = await this.userService.create(registerDto);
    const payload = { sub: user.id, username: user.username };
    
    // Log registration
    await this.auditLogService.createLog({
      userId: user.id,
      action: 'AUTH_REGISTER',
      resourceName: 'User',
      resourceId: String(user.id),
      oldValues: null,
      newValues: { username: user.username, email: user.email, name: user.name },
      ipAddress: ip,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.userService.findByUsername(loginDto.username);
    if (!user) {
      // Log failed login attempt (user not found)
      await this.auditLogService.createLog({
        userId: null,
        actorName: loginDto.username,
        actorRole: 'Guest',
        action: 'AUTH_LOGIN_FAILED',
        resourceName: 'User',
        resourceId: 'unknown',
        oldValues: null,
        newValues: { username: loginDto.username, reason: 'User not found' },
        ipAddress: ip,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      // Log failed login attempt (invalid password)
      await this.auditLogService.createLog({
        userId: user.id,
        actorName: user.name || user.username,
        actorRole: user.role?.name || 'User',
        action: 'AUTH_LOGIN_FAILED',
        resourceName: 'User',
        resourceId: String(user.id),
        oldValues: null,
        newValues: { username: loginDto.username, reason: 'Invalid password' },
        ipAddress: ip,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username };
    const response = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      access_token: this.jwtService.sign(payload),
    };

    // Log successful login
    await this.auditLogService.createLog({
      userId: user.id,
      action: 'AUTH_LOGIN',
      resourceName: 'User',
      resourceId: String(user.id),
      oldValues: null,
      newValues: { username: user.username },
      ipAddress: ip,
      userAgent,
    });

    return response;
  }

  async getProfile(userId: number) {
    const user = await this.userService.findOne(userId);
    const { password: _password, ...result } = user;
    return result;
  }
}
