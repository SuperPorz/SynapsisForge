import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// prettier-ignore
import { LessonContent, LessonContentDocument } from './schemas/lesson-content.schema';
import { CreateLessonContentDto } from './dto/create-lesson-content.dto';
import { UpdateLessonContentDto } from './dto/update-lesson-content.dto';
import { Lesson } from '../../common/entities/lessons.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(LessonContent.name)
    private lessonContentModel: Model<LessonContentDocument>,

    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
  ) {}

  // ---------------------------------------------------------------------------
  // PostgreSQL — CRUD lezioni
  // ---------------------------------------------------------------------------

  async createLesson(courseId: string, dto: CreateLessonDto): Promise<Lesson> {
    const lesson = this.lessonRepository.create({ ...dto, courseId });
    return await this.lessonRepository.save(lesson);
  }

  async updateLesson(
    courseId: string,
    id: string,
    dto: UpdateLessonDto,
  ): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id, courseId },
    });
    if (!lesson)
      throw new NotFoundException(
        `Lezione ${id} non trovata nel corso ${courseId}`,
      );

    Object.assign(lesson, dto);
    return await this.lessonRepository.save(lesson);
  }

  async softDeleteLesson(courseId: string, id: string): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id, courseId },
    });
    if (!lesson)
      throw new NotFoundException(
        `Lezione ${id} non trovata nel corso ${courseId}`,
      );

    await this.lessonRepository.softDelete(id);
  }

  async findLesson(courseId: string, id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id, courseId },
      relations: ['course'],
    });
    if (!lesson)
      throw new NotFoundException(
        `Lezione ${id} non trovata nel corso ${courseId}`,
      );

    return lesson;
  }

  // ---------------------------------------------------------------------------
  // Aggregato PostgreSQL + MongoDB — dettaglio lezione con contenuto
  // ---------------------------------------------------------------------------

  async getLessonWithContent(
    courseId: string,
    id: string,
  ): Promise<{
    id: string;
    title: string;
    order: number;
    duration_seconds: number;
    course: Lesson['course'];
    content: LessonContentDocument | null;
  }> {
    const lesson = await this.findLesson(courseId, id); // lancia NotFoundException se non esiste
    const content = await this.lessonContentModel
      .findOne({ lessonId: id })
      .exec();

    return {
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      duration_seconds: lesson.duration_seconds,
      course: lesson.course,
      content: content ?? null,
    };
  }

  // ---------------------------------------------------------------------------
  // MongoDB — contenuto lezione
  // ---------------------------------------------------------------------------

  async createContent(
    lessonId: string,
    dto: CreateLessonContentDto,
  ): Promise<LessonContentDocument> {
    const doc = new this.lessonContentModel({ ...dto, lessonId });
    return await doc.save();
  }

  async updateContent(
    lessonId: string,
    dto: UpdateLessonContentDto,
  ): Promise<LessonContentDocument> {
    const updated = await this.lessonContentModel
      .findOneAndUpdate({ lessonId }, { $set: dto }, { new: true })
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
}
