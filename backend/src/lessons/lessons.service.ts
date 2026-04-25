import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// prettier-ignore
import { LessonContent, LessonContentDocument } from './schemas/lesson-content.schema';
import { CreateLessonContentDto } from './dto/create-lesson-content.dto';
import { Lesson } from '../entities/lessons.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

type UpdateLessonContentDto = Partial<Omit<CreateLessonContentDto, 'lessonId'>>;

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(LessonContent.name)
    private lessonContentModel: Model<LessonContentDocument>,

    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
  ) {}

  async createContent(
    dto: CreateLessonContentDto,
  ): Promise<LessonContentDocument> {
    const doc = new this.lessonContentModel(dto);
    return await doc.save();
  }

  async updateContent(
    lessonId: string,
    dto: UpdateLessonContentDto,
  ): Promise<LessonContentDocument> {
    const updated = await this.lessonContentModel
      .findOneAndUpdate(
        { lessonId },
        { $set: dto },
        { new: true }, // ritorna il documento aggiornato, non quello precedente
      )
      .exec();

    if (!updated)
      throw new NotFoundException(
        `Contenuto per lesson ${lessonId} non trovato`,
      );

    return updated;
  }

  async findContent(lessonId: string): Promise<LessonContentDocument | null> {
    return await this.lessonContentModel.findOne({ lessonId }).exec();
  }

  async findLesson(id: string): Promise<Lesson | null> {
    return await this.lessonRepository.findOne({
      where: { id },
      relations: ['course'], // include i dati del corso nella risposta merged
    });
  }
}
