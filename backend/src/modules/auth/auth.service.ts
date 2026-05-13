import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { User } from 'src/common/entities/users.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { EnvironmentVariables } from 'src/common/types/env';
import { CreateUserDto } from '../users/dto/create-user.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
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
  ) {}

  async register(dto: CreateUserDto): Promise<AuthTokens> {
    // 1. Verifica che l'email non sia già in uso
    const existing = await this.usersService.findByEmail(dto.email);

    // 2.1 caso — email OAuth vs email già registrata con password
    if (existing) {
      if (!existing.password) {
        throw new ConflictException(
          'Email già associata a un account esterno. Accedi con Google o GitHub.',
        );
      }
      throw new ConflictException('Email già in uso');
    }

    // 2.2 Hash della password
    const password = await bcrypt.hash(dto.password, 10);

    // 3. Crea l'utente tramite UsersService
    let user: User;
    try {
      user = await this.usersService.create({ ...dto, password });
    } catch (error) {
      console.error('[AuthService.register] Errore creazione utente:', error);
      throw new InternalServerErrorException(
        "Errore durante la creazione dell'utente",
      );
    }

    // 4. Genera e salva i token
    try {
      const tokens = await this.generateTokens(user);
      await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
      return tokens;
    } catch (error) {
      console.error('[AuthService.register] Errore generazione token:', error);
      throw new InternalServerErrorException(
        'Errore durante la generazione dei token',
      );
    }
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    // 1. Trova l'utente
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenziali non valide');

    // 2.1 Utente registrato via OAuth — non ha password
    if (!user.password) {
      throw new UnauthorizedException(
        'Account registrato tramite provider esterno. Usa Google o GitHub per accedere.',
      );
    }

    // 2.2 Verifica password
    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch)
      throw new UnauthorizedException('Credenziali non valide');

    // 3. Genera e salva i token
    try {
      const tokens = await this.generateTokens(user);
      await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
      return tokens;
    } catch (error) {
      console.error('[AuthService.login] Errore generazione token:', error);
      throw new InternalServerErrorException('Errore durante il login');
    }
  }

  async logout(userId: string): Promise<void> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Utente non trovato');

    try {
      await this.usersRepository.update(userId, { refresh_token_hash: null });
    } catch (error) {
      console.error('[AuthService.logout] Errore invalidazione token:', error);
      throw new InternalServerErrorException('Errore durante il logout');
    }
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Utente non trovato');
    if (!user.refresh_token_hash)
      throw new UnauthorizedException(
        'Sessione scaduta, effettua nuovamente il login',
      );

    // Verifica che il refresh token combaci con l'hash salvato
    const tokenMatch = await bcrypt.compare(
      refreshToken,
      user.refresh_token_hash,
    );
    if (!tokenMatch)
      throw new UnauthorizedException('Refresh token non valido');

    try {
      const tokens = await this.generateTokens(user);
      await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
      return tokens;
    } catch (error) {
      console.error('[AuthService.refreshTokens] Errore rinnovo token:', error);
      throw new InternalServerErrorException(
        'Errore durante il rinnovo del token',
      );
    }
  }

  async findOrCreateOAuthUser(
    providerName: string,
    providerId: string,
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<AuthTokens> {
    // 1. Cerca un utente già collegato a questo provider
    let user = await this.usersService.findByProviderId(
      providerName,
      providerId,
    );

    if (!user) {
      // 2. Nessun record provider — cerca per email
      const existingByEmail = await this.usersService.findByEmail(email);

      if (existingByEmail) {
        // 2a. Utente già registrato con email/password → collega il provider
        user = await this.usersService.linkProvider(
          existingByEmail.id,
          providerName,
          providerId,
        );
      } else {
        // 2b. Utente nuovo → crea account senza password + collega provider
        const newUser = await this.usersService.create({
          email,
          first_name: firstName,
          last_name: lastName,
          password: null,
        });
        user = await this.usersService.linkProvider(
          newUser.id,
          providerName,
          providerId,
        );
      }
    }

    // 3. Genera JWT lato app
    const tokens = await this.generateTokens(user);
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  /////////////////////////////////////////////////////////////////////////
  /////////////////////////--- helpers privati ---////////////////////////
  ////////////////////////////////////////////////////////////////////////

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
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
    await this.usersRepository.update(userId, { refresh_token_hash: hash });
  }
}
