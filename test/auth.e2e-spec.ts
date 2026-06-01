/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/user/user.entity.js';
import { Repository } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;

  const testUsername = `e2e_user_${Math.random().toString(36).substring(7)}`;
  const testPassword = 'testpassword123';
  const testEmail = 'e2e_test@example.com';
  const testName = 'E2E Test User';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable validation pipe to match main application setup
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  });

  afterAll(async () => {
    // Cleanup the registered user if created
    if (userRepository) {
      await userRepository.delete({ username: testUsername });
    }
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should successfully register a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: testUsername,
          password: testPassword,
          email: testEmail,
          name: testName,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(testUsername);
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail to register user with duplicate username', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: testUsername,
          password: testPassword,
        })
        .expect(409);

      expect(response.body.message).toContain('Username already exists');
    });

    it('should fail validation if password is less than 6 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: `user_${Date.now()}`,
          password: '123',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    it('should successfully login and return a token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUsername,
          password: testPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.username).toBe(testUsername);
    });

    it('should fail to login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUsername,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    let token: string;

    beforeAll(async () => {
      // Obtain a token
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUsername,
          password: testPassword,
        });
      token = response.body.access_token;
    });

    it('should fetch user profile when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.username).toBe(testUsername);
      expect(response.body.email).toBe(testEmail);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail with 401 Unauthorized if no token provided', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should fail with 401 Unauthorized if invalid token provided', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
    });
  });
});
