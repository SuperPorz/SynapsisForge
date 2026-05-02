// prettier-ignore
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/common/entities/users.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { Course } from 'src/common/entities/courses.entity';
import { InstructorProfile } from 'src/common/entities/InstructorProfile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(InstructorProfile)
    private instructorProfileRepository: Repository<InstructorProfile>,
  ) {}

  async getProfile(userId: string): Promise<ResponseUserDto> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`); // lancia un 404 se l'utente non viene trovato
    }
    const dto = plainToInstance(ResponseUserDto, user);
    return dto;
  }

  // prettier-ignore
  async updateProfile( userId: string, updateData: Partial<UpdateUserDto>, ): Promise<ResponseUserDto> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`); // lancia un 404 se l'utente non viene trovato
    }
    Object.assign(user, updateData);
    await this.userRepository.save(user);
    const dto = plainToInstance(ResponseUserDto, user);
    return dto;
  }

  // la restituzione Course come array è temporanea
  async listCourses(userId: string): Promise<Course[]> {
    const instructorProfile = await this.instructorProfileRepository.findOne({
      where: { userId: userId },
      relations: ['courses'],
    });

    if (!instructorProfile) {
      throw new NotFoundException(`Instructor with id ${userId} not found`);
    }

    return instructorProfile.courses ?? [];
  }
}
