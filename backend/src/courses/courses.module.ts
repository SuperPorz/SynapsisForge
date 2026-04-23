import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { Course } from 'src/orm/courses.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';

@Module({
  imports: [TypeOrmModule.forFeature([Course])], // serve per iniettare il repository di Course nei service di questo modulo
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
