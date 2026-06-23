import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesController } from './courses.controller';
import { Course } from 'src/common/entities/courses.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { Category } from 'src/common/entities/categories.entity';
import { Section } from 'src/common/entities/section.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { Review } from 'src/common/entities/reviews.entity';
import { Lesson } from 'src/common/entities/lessons.entity';
import { InstructorProfile } from 'src/common/entities/instructor-profile.entity';
import {
  LessonProgress,
  LessonProgressSchema,
} from 'src/modules/enrollments/schemas/lesson-progress.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Category, Section, Enrollment, Review, Lesson, InstructorProfile]),
    MongooseModule.forFeature(
      [{ name: LessonProgress.name, schema: LessonProgressSchema }],
      'mongo_synapsis',
    ),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
