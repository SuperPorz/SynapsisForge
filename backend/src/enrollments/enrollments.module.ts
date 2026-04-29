import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { Course } from 'src/entities/courses.entity';
import { StudentProfile } from 'src/entities/StudentProfile.entity';
import { Enrollment } from 'src/entities/enrollments.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, StudentProfile, Course])],
  providers: [EnrollmentsService],
  controllers: [EnrollmentsController],
})
export class EnrollmentsModule {}
