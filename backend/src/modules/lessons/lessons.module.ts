import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
// prettier-ignore
import { LessonContent, LessonContentSchema } from './schemas/lesson-content.schema';
import { Lesson } from '../../common/entities/lessons.entity';
import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { Section } from 'src/common/entities/section.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { S3Module } from '../s3/s3.module';
// prettier-ignore
import { LessonPlayerController } from './lesson-player.controller';
// prettier-ignore
import { LessonProgress, LessonProgressSchema } from '../enrollments/schemas/lesson-progress.schema';
import { Enrollment } from 'src/common/entities/enrollments.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, Section, Enrollment]),
    MongooseModule.forFeature(
      [
        { name: LessonContent.name, schema: LessonContentSchema },
        { name: LessonProgress.name, schema: LessonProgressSchema }, // ← aggiunto
      ],
      'mongo_synapsis',
    ), // <--- DEVE ESSERE IDENTICO al connectionName in AppModule),
    EnrollmentsModule,
    S3Module,
  ],
  controllers: [LessonsController, LessonPlayerController],
  providers: [LessonsService],
})
export class LessonsModule {}
