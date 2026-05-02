import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../common/entities/users.entity';
import { InstructorProfile } from '../common/entities/InstructorProfile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, InstructorProfile])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
