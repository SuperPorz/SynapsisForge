import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/users.entity';
import { Course } from 'src/common/entities/courses.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Course, Enrollment])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
