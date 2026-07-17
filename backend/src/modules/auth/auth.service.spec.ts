import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from 'src/common/entities/users.entity';
import { UsersService } from '../users/users.service';
import { CacheService } from 'src/modules/cache/cache.service';
import {
  UserRole,
  SubscriptionPlan,
} from 'src/common/entities/enum/users.enum';
import type { CreateUserDto } from '../users/dto/create-user.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByProviderId: jest.fn(),
    create: jest.fn(),
    createOAuthUser: jest.fn(),
    linkProvider: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUserRepo = {
    findOneBy: jest.fn(),
    findOneByOrFail: jest.fn(),
    update: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const mockUser = {
    id: USER_ID,
    email: 'alice@example.com',
    password: 'hashed_real_password',
    first_name: 'Alice',
    last_name: 'Thompson',
    role: UserRole.STUDENT,
    plan: SubscriptionPlan.FREE,
    isVerified: true,
    email_verification_token: null,
    password_reset_token: null,
    password_reset_expires_at: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key] ?? null;
    });

    mockJwtService.signAsync.mockResolvedValue('mock.jwt.token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: CacheService, useValue: mockCacheService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const createDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'Secure123!',
      first_name: 'New',
      last_name: 'User',
      birth_date: new Date('1990-01-01'),
      country: 'ITALY' as any,
      role: UserRole.STUDENT,
    };

    it('should register a new user and emit event', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        ...mockUser,
        id: 'new-id',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
      });

      const result = await service.register(createDto);

      expect(result).toEqual({
        message: 'Registrazione completata. Controlla la tua email.',
      });
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...createDto,
        password: 'hashed_password',
      });
      expect(mockUserRepo.update).toHaveBeenCalledWith('new-id', {
        email_verification_token: expect.any(String),
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'user.registered',
        expect.objectContaining({
          userId: 'new-id',
          email: 'new@example.com',
        }),
      );
    });

    it('should throw ConflictException when email already in use', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should throw specific error when email belongs to OAuth account', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: null,
      });

      await expect(service.register(createDto)).rejects.toThrow(
        'associata a un account esterno',
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'alice@example.com',
      password: 'Password123!',
    };

    it('should login successfully with valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'mock.jwt.token',
        refreshToken: 'mock.jwt.token',
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        `sf:session:refresh:${USER_ID}`,
        expect.any(String),
        expect.any(Number),
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for OAuth-only account', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: null,
      });

      await expect(service.login(loginDto)).rejects.toThrow('Google o GitHub');
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when email not verified', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        isVerified: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        'Email non verificata',
      );
    });
  });

  describe('refreshTokens', () => {
    const REFRESH_TOKEN = 'valid.refresh.token';

    it('should return new tokens when refresh is valid', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(mockUser);
      mockCacheService.get.mockResolvedValue('stored_hash');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.refreshTokens(USER_ID, REFRESH_TOKEN);

      expect(result).toEqual({
        accessToken: 'mock.jwt.token',
        refreshToken: 'mock.jwt.token',
      });
      expect(mockCacheService.del).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.refreshTokens(USER_ID, REFRESH_TOKEN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when no stored session', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(mockUser);
      mockCacheService.get.mockResolvedValue(null);

      await expect(
        service.refreshTokens(USER_ID, REFRESH_TOKEN),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when refresh token does not match', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(mockUser);
      mockCacheService.get.mockResolvedValue('stored_hash');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.refreshTokens(USER_ID, REFRESH_TOKEN),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete refresh token from cache', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(mockUser);

      await service.logout(USER_ID);

      expect(mockCacheService.del).toHaveBeenCalledWith(
        `sf:session:refresh:${USER_ID}`,
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      await expect(service.logout(USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and return tokens', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({
        ...mockUser,
        email_verification_token: 'valid-token',
      });
      mockUserRepo.findOneByOrFail.mockResolvedValue(mockUser);

      const result = await service.verifyEmail('valid-token');

      expect(result).toEqual({
        accessToken: 'mock.jwt.token',
        refreshToken: 'mock.jwt.token',
      });
      expect(mockUserRepo.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          isVerified: true,
          email_verification_token: null,
        }),
      );
    });

    it('should throw BadRequestException with invalid token', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('sendPasswordReset', () => {
    it('should generate reset token for existing user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.sendPasswordReset({
        email: 'alice@example.com',
      });

      expect(result.message).toContain('riceverai un link');
      expect(mockUserRepo.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          password_reset_token: expect.any(String),
          password_reset_expires_at: expect.any(Date),
        }),
      );
    });

    it('should return generic message for unknown email (anti-enumeration)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.sendPasswordReset({
        email: 'unknown@example.com',
      });

      expect(result.message).toContain('riceverai un link');
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('confirmPasswordReset', () => {
    it('should reset password and invalidate sessions', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({
        ...mockUser,
        password_reset_token: 'reset-token',
        password_reset_expires_at: new Date(Date.now() + 3600000),
      });

      const result = await service.confirmPasswordReset({
        token: 'reset-token',
        newPassword: 'NewPass123!',
      });

      expect(result.message).toContain('Password aggiornata');
      expect(mockUserRepo.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          password: 'hashed_password',
          password_reset_token: null,
          password_reset_expires_at: null,
        }),
      );
      expect(mockCacheService.del).toHaveBeenCalledWith(
        `sf:session:refresh:${USER_ID}`,
      );
    });

    it('should throw BadRequestException with invalid token', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.confirmPasswordReset({
          token: 'bad-token',
          newPassword: 'NewPass123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with expired token', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({
        ...mockUser,
        password_reset_token: 'expired-token',
        password_reset_expires_at: new Date(Date.now() - 3600000),
      });

      await expect(
        service.confirmPasswordReset({
          token: 'expired-token',
          newPassword: 'NewPass123!',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockUserRepo.update).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          password_reset_token: null,
          password_reset_expires_at: null,
        }),
      );
    });
  });
});
