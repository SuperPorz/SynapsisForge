import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { Course } from 'src/common/entities/courses.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { Category } from 'src/common/entities/categories.entity';
import { Section } from 'src/common/entities/section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Category, Section])],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
