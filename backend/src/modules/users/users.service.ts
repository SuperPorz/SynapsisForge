import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/common/entities/users.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UserProviders } from 'src/common/entities/user_providers.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(UserProviders)
    private userProvidersRepository: Repository<UserProviders>,
  ) {}

  // ---------------------------------------------------------------------------
  // Metodi interni — non hanno endpoint HTTP, vengono chiamati da altri service
  // tramite dependency injection (AuthService, JwtStrategy, ecc.)
  // ---------------------------------------------------------------------------

  // Usato da JwtStrategy per validare il payload del token
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  // Usato da AuthService durante il login per recuperare l'utente + password hash
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  // ---------------------------------------------------------------------------
  // Endpoint GET /users/me
  // ---------------------------------------------------------------------------

  async getProfile(userId: string): Promise<ResponseUserDto> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    return plainToInstance(ResponseUserDto, user);
  }

  // ---------------------------------------------------------------------------
  // Endpoint PATCH /users/me
  // ---------------------------------------------------------------------------

  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    Object.assign(user, dto);
    await this.userRepository.save(user);

    return plainToInstance(ResponseUserDto, user);
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data); //manca await per ora
    return await this.userRepository.save(user);
  }

  // ---------------------------------------------------------------------------
  // OAuth 2.0 - find User by provider
  // ---------------------------------------------------------------------------

  // prettier-ignore
  async findByProviderId( providerName: string, providerId: string ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.providers', 'provider')
      .where('provider.provider_name = :providerName', { providerName })
      .andWhere('provider.provider_id = :providerId', { providerId })
      .getOne();
  }

  // collega un utente ad un provider
  // prettier-ignore
  async linkProvider(userId: string, providerName: string, providerId: string): Promise<User> {
    // 1. Crea il record provider
    const provider = this.userProvidersRepository.create({
      userId,
      provider_name: providerName,
      provider_id: providerId,
    });
    await this.userProvidersRepository.save(provider);

    // 2. Ritorna l'utente aggiornato con i provider caricati (PARTE ELIMINABILE)
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['providers'],
    });
    if (!user) throw new NotFoundException('Utente non trovato');
    return user;
  }
}
