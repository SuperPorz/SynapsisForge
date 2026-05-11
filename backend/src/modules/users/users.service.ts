import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/common/entities/users.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
}
