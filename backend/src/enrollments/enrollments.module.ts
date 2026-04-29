import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';

// Entities
import { Course } from 'src/entities/courses.entity';
import { StudentProfile } from 'src/entities/StudentProfile.entity';
import { Enrollment } from 'src/entities/enrollments.entity';

// Mongoose Schema
import {
  LessonProgress,
  LessonProgressSchema,
} from 'src/enrollments/schemas/lesson-progress.schema';
import { Payment } from 'src/entities/payments.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, StudentProfile, Course, Payment]),
    MongooseModule.forFeature(
      [{ name: LessonProgress.name, schema: LessonProgressSchema }],
      'mongo_synapsis', // <--- DEVE ESSERE IDENTICO al connectionName in AppModule
    ),
  ],
  providers: [EnrollmentsService],
  controllers: [EnrollmentsController],
})
export class EnrollmentsModule {}
