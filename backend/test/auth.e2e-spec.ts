import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { createTestApp } from './helpers';

const mockAuthService = {
  login: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
  decode: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:4200'),
};

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    app = await createTestApp(moduleFixture);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    const validPayload = {
      email: 'james.carter@synapsis.dev',
      password: 'Password123!',
    };

    it('should return 200 + access token for valid credentials', async () => {
      mockAuthService.login.mockResolvedValue({
        accessToken: 'valid_access_token',
        refreshToken: 'valid_refresh_token',
      });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validPayload)
        .expect(201);

      expect(res.body.data.accessToken).toBe('valid_access_token');
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Credenziali non valide'),
      );

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrongpass' })
        .expect(401);

      expect(res.body.message).toContain('Credenziali non valide');
    });
  });
});
