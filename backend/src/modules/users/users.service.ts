import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/users.entity';
import { UserProviders } from 'src/common/entities/user_providers.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { StudentProfile } from 'src/common/entities/student-profile.entity';

// Tipo dedicato al flusso OAuth — email nullable by design.
// Non riusa CreateUserDto perché quel DTO ha email @IsEmail() obbligatoria
// e password @MinLength(8) obbligatoria: due contratti incompatibili.
interface CreateOAuthUserData {
  email: string | null;
  first_name: string;
  last_name: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(UserProviders)
    private userProvidersRepository: Repository<UserProviders>,

    @InjectRepository(StudentProfile)
    private studentProfileRepository: Repository<StudentProfile>,
  ) {}

  // ---------------------------------------------------------------------------
  // Lettura — usati da JwtStrategy e AuthService
  // ---------------------------------------------------------------------------

  // Usato da JwtStrategy per validare il payload del token
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  // Usato da AuthService durante login e findOrCreateOAuthUser
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  // ---------------------------------------------------------------------------
  // Endpoint GET /users/me
  // ---------------------------------------------------------------------------

  async getProfile(userId: string): Promise<ResponseUserDto> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user)
      throw new NotFoundException(`Utente con id ${userId} non trovato`);

    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Endpoint PATCH /users/me
  // ---------------------------------------------------------------------------

  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user)
      throw new NotFoundException(`Utente con id ${userId} non trovato`);

    Object.assign(user, dto);
    await this.usersRepository.save(user);

    return plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Creazione utente — due metodi distinti, due contratti distinti
  // ---------------------------------------------------------------------------

  // Usato da AuthService.register() — email e password garantite dal DTO.
  // TypeScript sa che email è string e password è string: nessun nullable qui.
  async create(dto: CreateUserDto & { password: string }): Promise<User> {
    const user = this.usersRepository.create(dto);
    const savedUser = await this.usersRepository.save(user);

    // Crea automaticamente il profilo student
    const studentProfile = this.studentProfileRepository.create({
      userId: savedUser.id,
    });
    await this.studentProfileRepository.save(studentProfile);

    return savedUser;
  }

  // Usato SOLO dal flusso OAuth (Google, GitHub, futuri provider).
  // email è nullable perché GitHub non garantisce email pubblica.
  // password è sempre null: gli utenti OAuth non hanno credenziali locali.
  async createOAuthUser(data: CreateOAuthUserData): Promise<User> {
    const user = this.usersRepository.create({
      ...data,
      password: null,
    });
    const savedUser = await this.usersRepository.save(user);

    // Crea automaticamente il profilo student
    const studentProfile = this.studentProfileRepository.create({
      userId: savedUser.id,
    });
    await this.studentProfileRepository.save(studentProfile);

    return savedUser;
  }

  // ---------------------------------------------------------------------------
  // OAuth 2.0 — gestione provider
  // ---------------------------------------------------------------------------

  // Cerca un utente già collegato a un provider specifico (es. github, google).
  // Usato come prima lookup in findOrCreateOAuthUser per evitare duplicati.
  async findByProviderId(
    providerName: string,
    providerId: string,
  ): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.providers', 'provider')
      .where('provider.provider_name = :providerName', { providerName })
      .andWhere('provider.provider_id = :providerId', { providerId })
      .getOne();
  }

  // Collega un provider OAuth a un utente esistente.
  // Chiamato sia quando si collega un provider a un account email/password già
  // esistente, sia dopo createOAuthUser per un utente completamente nuovo.
  async linkProvider(
    userId: string,
    providerName: string,
    providerId: string,
  ): Promise<User> {
    const provider = this.userProvidersRepository.create({
      userId,
      provider_name: providerName,
      provider_id: providerId,
    });
    await this.userProvidersRepository.save(provider);

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['providers'],
    });
    if (!user) throw new NotFoundException('Utente non trovato');
    return user;
  }
}
