import {
  ConflictException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@redis/client';
import { createHash } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

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
  email: string;
  role: string;
  plan: string;
  jti?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService implements OnModuleDestroy {
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
      verificationToken: token,
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
    const locked = await this.cacheService.get(`sf:login:locked:${dto.email}`);
    if (locked) {
      throw new UnauthorizedException(
        'Account temporaneamente bloccato per troppi tentativi. Riprova tra 15 minuti.',
      );
    }

    const user = await this.usersService.findByEmail(dto.email);

    const DELAY_MS = 200;

    if (!user) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
      throw new UnauthorizedException('Credenziali non valide');
    }

    if (!user.password) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
      throw new UnauthorizedException(
        'Account registrato tramite provider esterno. Usa Google o GitHub per accedere.',
      );
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      const attempts =
        (await this.cacheService.get<number>(
          `sf:login:attempts:${dto.email}`,
        )) ?? 0;
      const newAttempts = attempts + 1;
      await this.cacheService.set(
        `sf:login:attempts:${dto.email}`,
        newAttempts,
        15 * 60 * 1000,
      );

      if (newAttempts >= 5) {
        await this.cacheService.set(
          `sf:login:locked:${dto.email}`,
          true,
          15 * 60 * 1000,
        );
      }

      await new Promise((r) => setTimeout(r, DELAY_MS));
      throw new UnauthorizedException('Credenziali non valide');
    }

    if (!user.isVerified) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
      throw new UnauthorizedException(
        'Email non verificata. Controlla la tua casella di posta.',
      );
    }

    await this.cacheService.del(`sf:login:attempts:${dto.email}`);
    await this.cacheService.del(`sf:login:locked:${dto.email}`);

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

    const tokenMatch = await this.verifyToken(refreshToken, storedHash);
    if (!tokenMatch) {
      throw new UnauthorizedException('Refresh token non valido');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REFRESH TOKENS (MOBILE) — con reuse detection
  // Usa Redis diretto (non cache-manager) per consistenza immediata.
  // ─────────────────────────────────────────────────────────────────────────────
  async onModuleDestroy() {
    if (this.redisClient && this.redisClient.isOpen) {
      await this.redisClient.quit();
    }
  }

  private redisClient: ReturnType<typeof createClient> | null = null;

  private readonly logger = new Logger(AuthService.name);

  private getRedis() {
    if (!this.redisClient) {
      const url =
        process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({ url } as any);
      this.redisClient.on('error', (err: Error) =>
        this.logger.error('Redis error:', err.message),
      );
    }
    return this.redisClient;
  }

  private async redisGet(key: string): Promise<string | null> {
    const client = this.getRedis();
    if (!client.isOpen) await client.connect();
    const raw = await client.get(`keyv::keyv:${key}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw).value as string;
    } catch {
      return null;
    }
  }

  private async redisSet(
    key: string,
    value: string,
    ttlMs: number,
  ): Promise<void> {
    const client = this.getRedis();
    if (!client.isOpen) await client.connect();
    const payload = JSON.stringify({
      value,
      expires: Date.now() + ttlMs,
    });
    await client.set(`keyv::keyv:${key}`, payload, { PX: ttlMs });
  }

  private async redisDel(key: string): Promise<void> {
    const client = this.getRedis();
    if (!client.isOpen) await client.connect();
    await client.del(`keyv::keyv:${key}`);
  }

  async refreshTokensMobile(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Utente non trovato');

    const key = `sf:session:refresh:${userId}`;
    const storedHash = await this.redisGet(key);

    if (!storedHash) {
      throw new UnauthorizedException(
        'Sessione scaduta, effettua nuovamente il login',
      );
    }

    const tokenMatch = await this.verifyToken(refreshToken, storedHash);
    if (!tokenMatch) {
      await this.redisDel(key);
      throw new UnauthorizedException(
        'Sessione terminata per sicurezza. Effettua nuovamente il login.',
      );
    }

    const tokens = await this.generateTokens(user);
    const newHash = await this.hashToken(tokens.refreshToken);
    const ttl = this.parseTtl(
      this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true }) ?? '7d',
    );
    await this.redisSet(key, newHash, ttl);
    const payloadPart = tokens.refreshToken.split('.')[1];
    const decoded = payloadPart
      ? JSON.parse(Buffer.from(payloadPart, 'base64').toString())
      : null;
    this.logger.warn(
      `[MOBILE_DEBUG] saved new hash for token iat=${decoded?.iat}`,
    );
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
  // GOOGLE — verifica idToken dal client mobile
  // ─────────────────────────────────────────────────────────────────────────────
  async loginWithGoogle(idToken: string): Promise<AuthTokens> {
    const client = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID', { infer: true }),
    );

    let payload: { sub: string; email: string; given_name: string; family_name: string };
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: this.configService.get('GOOGLE_CLIENT_ID', { infer: true }),
      });
      const gp = ticket.getPayload()!;
      payload = {
        sub: gp.sub,
        email: gp.email ?? '',
        given_name: gp.given_name ?? '',
        family_name: gp.family_name ?? '',
      };
    } catch {
      throw new UnauthorizedException('Token Google non valido');
    }

    return this.findOrCreateOAuthUser(
      'google',
      payload.sub,
      payload.email,
      payload.given_name,
      payload.family_name,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GITHUB — scambia il codice OAuth con GitHub e recupera il profilo
  // ─────────────────────────────────────────────────────────────────────────────
  async loginWithGithubCode(code: string): Promise<AuthTokens> {
    const ghClientId = this.configService.get('GH_CLIENT_ID', { infer: true });
    const ghClientSecret = this.configService.get('GH_CLIENT_SECRET', { infer: true });

    // 1. Scambia il codice per un access token
    let accessToken: string;
    try {
      const tokenResp = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: ghClientId,
            client_secret: ghClientSecret,
            code,
          }),
        },
      );
      const tokenData = (await tokenResp.json()) as {
        access_token?: string;
        error_description?: string;
      };
      if (!tokenData.access_token) {
        throw new Error(tokenData.error_description ?? 'No access token');
      }
      accessToken = tokenData.access_token;
    } catch (err) {
      throw new UnauthorizedException(
        `Scambio codice GitHub fallito: ${(err as Error).message}`,
      );
    }

    // 2. Recupera il profilo utente GitHub
    let ghProfile: { id: number; email: string | null; name: string | null };
    try {
      const userResp = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      ghProfile = (await userResp.json()) as {
        id: number;
        email: string | null;
        name: string | null;
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `Recupero profilo GitHub fallito: ${(err as Error).message}`,
      );
    }

    // 3. Tenta anche di ottenere l'email (può essere privata)
    let email = ghProfile.email;
    if (!email) {
      try {
        const emailsResp = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const emails = (await emailsResp.json()) as Array<{
          email: string;
          primary: boolean;
        }>;
        const primary = emails.find((e) => e.primary);
        if (primary) email = primary.email;
      } catch {
        // fallback — nessuna email
      }
    }

    const fullName = (ghProfile.name ?? '').split(' ');
    return this.findOrCreateOAuthUser(
      'github',
      String(ghProfile.id),
      email ?? null,
      fullName[0] ?? '',
      fullName.slice(1).join(' ') ?? '',
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GITHUB DEVICE FLOW — per dispositivi senza browser (mobile)
  // ─────────────────────────────────────────────────────────────────────────────
  async initGithubDeviceFlow(): Promise<{
    device_code: string;
    user_code: string;
    verification_uri: string;
    interval: number;
  }> {
    const ghClientId = this.configService.get('GH_CLIENT_ID', { infer: true });

    const resp = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: ghClientId,
        scope: 'user:email',
      }),
    });

    const data = (await resp.json()) as {
      device_code: string;
      user_code: string;
      verification_uri: string;
      interval: number;
    };

    // Salva il device_code in Redis con TTL 15 minuti
    const ttlMs = 15 * 60 * 1000;
    await this.cacheService.set(
      `sf:github:device:${data.device_code}`,
      'pending',
      ttlMs,
    );

    return data;
  }

  async pollGithubDeviceFlow(
    deviceCode: string,
  ): Promise<{ status: string } | AuthTokens> {
    const ghClientId = this.configService.get('GH_CLIENT_ID', { infer: true });
    const ghClientSecret = this.configService.get('GH_CLIENT_SECRET', { infer: true });

    // Fa il polling di GitHub per sapere se l'utente ha autorizzato
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: ghClientId,
        client_secret: ghClientSecret,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });

    const data = (await tokenResp.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (data.access_token) {
      // L'utente ha autorizzato — recupera profilo e genera JWT
      const userResp = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const ghProfile = (await userResp.json()) as {
        id: number;
        email: string | null;
        name: string | null;
      };

      let email = ghProfile.email;
      if (!email) {
        try {
          const emailsResp = await fetch('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });
          const emails = (await emailsResp.json()) as Array<{
            email: string;
            primary: boolean;
          }>;
          const primary = emails.find((e) => e.primary);
          if (primary) email = primary.email;
        } catch {
          // fallback
        }
      }

      const fullName = (ghProfile.name ?? '').split(' ');
      await this.cacheService.del(`sf:github:device:${deviceCode}`);
      return this.findOrCreateOAuthUser(
        'github',
        String(ghProfile.id),
        email ?? null,
        fullName[0] ?? '',
        fullName.slice(1).join(' ') ?? '',
      );
    }

    if (data.error === 'authorization_pending') {
      return { status: 'pending' };
    }

    if (data.error === 'slow_down') {
      return { status: 'pending' };
    }

    // expired, access_denied, etc.
    await this.cacheService.del(`sf:github:device:${deviceCode}`);
    return { status: 'expired' };
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
      email: user.email!,
      role: user.role,
      plan: user.plan,
    };

    const refreshPayload: JwtPayload = {
      email: user.email!,
      jti: uuidv4(),
      plan: user.plan,
      role: user.role,
      sub: user.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn:
          this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true }) ??
          '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async hashToken(token: string): Promise<string> {
    const sha256 = createHash('sha256').update(token).digest('hex');
    return bcrypt.hash(sha256, 10);
  }

  private async verifyToken(token: string, hash: string): Promise<boolean> {
    const sha256 = createHash('sha256').update(token).digest('hex');
    return bcrypt.compare(sha256, hash);
  }

  private async saveRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await this.hashToken(refreshToken);
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
