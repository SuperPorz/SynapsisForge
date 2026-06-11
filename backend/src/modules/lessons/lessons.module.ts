import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
// prettier-ignore
import { LessonContent, LessonContentSchema } from './schemas/lesson-content.schema';
import { Lesson } from '../../common/entities/lessons.entity';
import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { Section } from 'src/common/entities/section.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, Section]),
    MongooseModule.forFeature([
      { name: LessonContent.name, schema: LessonContentSchema },
    ]),
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}
