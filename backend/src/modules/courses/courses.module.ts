import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { Course } from 'src/common/entities/courses.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { Category } from 'src/common/entities/categories.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Category])], // serve per iniettare il repository di Course e Category nei service di questo modulo
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
