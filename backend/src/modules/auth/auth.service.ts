import {
  ConflictException,
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

import { User } from 'src/common/entities/users.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { PasswordConfirmDto } from './dto/password-confirm.dto';
import { EnvironmentVariables } from 'src/common/types/env';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { CacheService } from 'src/modules/cache/cache.service';

export interface JwtPayload {
  sub: string;
  email: string | null;
  role: string;
  plan: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService<EnvironmentVariables, true>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // REGISTER — crea utente e invia link di verifica (nessun JWT emesso)
  // ─────────────────────────────────────────────────────────────────────────────
  async register(dto: CreateUserDto): Promise<{ message: string }> {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      if (!existing.password) {
        throw new ConflictException(
          'Email già associata a un account esterno. Accedi con Google o GitHub.',
        );
      }
      throw new ConflictException('Email già in uso');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({ ...dto, password });

    const token = crypto.randomUUID();
    await this.usersRepository.update(user.id, {
      email_verification_token: token,
    });

    this.eventEmitter.emit('user.registered', {
      userId: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
    });

    return { message: 'Registrazione completata. Controlla la tua email.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VERIFY EMAIL — attiva account ed emette JWT
  // ─────────────────────────────────────────────────────────────────────────────
  async verifyEmail(token: string): Promise<AuthTokens> {
    const user = await this.usersRepository.findOneBy({
      email_verification_token: token,
    });

    if (!user) {
      throw new BadRequestException(
        'Token di verifica non valido o già utilizzato',
      );
    }

    await this.usersRepository.update(user.id, {
      isVerified: true,
      email_verification_token: null,
    });

    // Ricarica l'utente aggiornato prima di generare i token
    const verifiedUser = await this.usersRepository.findOneByOrFail({
      id: user.id,
    });

    const tokens = await this.generateTokens(verifiedUser);
    await this.saveRefreshTokenHash(verifiedUser.id, tokens.refreshToken);
    return tokens;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenziali non valide');

    if (!user.password) {
      throw new UnauthorizedException(
        'Account registrato tramite provider esterno. Usa Google o GitHub per accedere.',
      );
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    // Utente non verificato — messaggio specifico (403 semanticamente corretto,
    // ma UnauthorizedException è sufficiente per ora)
    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Email non verificata. Controlla la tua casella di posta.',
      );
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────────────────────
  async logout(userId: string): Promise<void> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Utente non trovato');

    await this.cacheService.del(`sf:session:refresh:${userId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REFRESH TOKENS
  // ─────────────────────────────────────────────────────────────────────────────
  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Utente non trovato');

    const storedHash = await this.cacheService.get<string>(
      `sf:session:refresh:${userId}`,
    );

    if (!storedHash) {
      throw new UnauthorizedException(
        'Sessione scaduta, effettua nuovamente il login',
      );
    }

    const tokenMatch = await bcrypt.compare(refreshToken, storedHash);
    if (!tokenMatch) {
      throw new UnauthorizedException('Refresh token non valido');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PASSWORD RESET — step 1: richiesta (invia link via console)
  // ─────────────────────────────────────────────────────────────────────────────
  async sendPasswordReset(dto: PasswordResetDto): Promise<{ message: string }> {
    const email: string = dto.email;
    const user = await this.usersService.findByEmail(email);

    // Risposta identica sia che l'utente esista o meno (anti-enumeration)
    if (!user) {
      return {
        message:
          'Se questa email è registrata, riceverai un link per reimpostare la password.',
      };
    }

    // Utente OAuth senza password — non ha senso il reset
    if (!user.password) {
      return {
        message:
          'Se questa email è registrata, riceverai un link per reimpostare la password.',
      };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minuti

    await this.usersRepository.update(user.id, {
      password_reset_token: token,
      password_reset_expires_at: expiresAt,
    });

    // TODO: sostituire con un MailService reale
    console.log(
      `[EMAIL] Link reset password: http://localhost:4200/reset-password?token=${token}`,
    );

    return {
      message:
        'Se questa email è registrata, riceverai un link per reimpostare la password.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PASSWORD RESET — step 2: conferma con token + nuova password
  // ─────────────────────────────────────────────────────────────────────────────
  async confirmPasswordReset(
    dto: PasswordConfirmDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOneBy({
      password_reset_token: dto.token,
    });

    if (!user) {
      throw new BadRequestException('Token non valido o già utilizzato');
    }

    if (
      !user.password_reset_expires_at ||
      user.password_reset_expires_at < new Date()
    ) {
      // Pulisci il token scaduto
      await this.usersRepository.update(user.id, {
        password_reset_token: null,
        password_reset_expires_at: null,
      });
      throw new BadRequestException(
        'Token scaduto. Richiedi un nuovo link di reset.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Salva nuova password, invalida token reset e sessioni attive
    await this.usersRepository.update(user.id, {
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires_at: null,
    });
    await this.cacheService.del(`sf:session:refresh:${user.id}`);

    return { message: 'Password aggiornata. Effettua nuovamente il login.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OAUTH — trova o crea utente tramite provider esterno
  // ─────────────────────────────────────────────────────────────────────────────
  async findOrCreateOAuthUser(
    providerName: string,
    providerId: string,
    email: string | null,
    firstName: string,
    lastName: string,
  ): Promise<AuthTokens> {
    let user = await this.usersService.findByProviderId(
      providerName,
      providerId,
    );

    if (!user) {
      const existingByEmail = email
        ? await this.usersService.findByEmail(email)
        : null;

      if (existingByEmail) {
        user = await this.usersService.linkProvider(
          existingByEmail.id,
          providerName,
          providerId,
        );
      } else {
        const newUser = await this.usersService.createOAuthUser({
          email,
          first_name: firstName,
          last_name: lastName,
        });
        user = await this.usersService.linkProvider(
          newUser.id,
          providerName,
          providerId,
        );
      }
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVATI
  // ─────────────────────────────────────────────────────────────────────────────

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn:
          this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true }) ??
          '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10);
    const ttl = this.parseTtl(
      this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true }) ?? '7d',
    );
    await this.cacheService.set(`sf:session:refresh:${userId}`, hash, ttl);
  }

  private parseTtl(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
