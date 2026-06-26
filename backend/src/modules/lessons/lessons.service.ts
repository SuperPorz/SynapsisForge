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
// prettier-ignore
import { LessonProgress, LessonProgressDocument } from '../enrollments/schemas/lesson-progress.schema';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { Section } from 'src/common/entities/section.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(LessonContent.name, 'mongo_synapsis')
    private lessonContentModel: Model<LessonContentDocument>,

    @InjectModel(LessonProgress.name, 'mongo_synapsis')
    private lessonProgressModel: Model<LessonProgressDocument>,

    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,

    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,

    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,

    private enrollmentsService: EnrollmentsService,
    private configService: ConfigService,
    private s3Service: S3Service,
  ) { }

  // ---------------------------------------------------------------------------
  // PostgreSQL — CRUD lezioni
  // ---------------------------------------------------------------------------

  async createLesson(courseId: string, dto: CreateLessonDto): Promise<Lesson> {
    const { section_id, ...rest } = dto;
    const lesson = this.lessonRepository.create({
      ...rest,
      duration_seconds: rest.duration_seconds ?? 0,
      courseId,
      section: section_id ? { id: section_id } : undefined,
    });
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

  async updateS3Key(
    lessonId: string,
    s3Key: string,
  ): Promise<LessonContentDocument> {
    const updated = await this.lessonContentModel
      .findOneAndUpdate({ lessonId }, { $set: { s3Key } }, { new: true })
      .exec();

    if (!updated)
      throw new NotFoundException(
        `Contenuto per lezione ${lessonId} non trovato`,
      );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Player — video + progresso
  // ---------------------------------------------------------------------------

  async getVideoUrl(
    enrollmentId: string,
    lessonId: string,
  ): Promise<{
    videoUrl: string;
    last_position_seconds: number;
    quiz: {
      question: string;
      options: { label: string; text: string }[];
      correctAnswer: string;
      explanation: string | null;
    }[];
    sections: {
      id: string;
      title: string;
      order: number;
      lessons: {
        id: string;
        title: string;
        order: number;
        duration_seconds: number;
      }[];
    }[];
    completedLessonIds: string[];
    quizAnswers: {
      questionIndex: number;
      selectedLabel: string;
      correct: boolean;
    }[];
  }> {
    // 1. verifica enrollment + carica course
    const enrollment = await this.enrollmentsService.findById(enrollmentId);
    if (!enrollment)
      throw new NotFoundException(`Enrollment ${enrollmentId} non trovato`);

    // 2. recupera lezione da PG
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException(`Lezione ${lessonId} non trovata`);

    // 3. recupera LessonContent da MongoDB → s3Key
    const content = await this.lessonContentModel.findOne({ lessonId }).exec();
    if (!content)
      throw new NotFoundException(
        `Contenuto per lezione ${lessonId} non trovato`,
      );

    // 4. genera signed URL S3 oppure usa videoUrl diretto (USE_S3=false in dev)
    const useS3 = this.configService.get<string>('USE_S3') === 'true';
    let videoUrl: string;

    if (useS3) {
      videoUrl = await this.s3Service.generatePresignedGetUrl(content.s3Key, undefined, 3600);
    } else {
      videoUrl = content.videoUrl;
    }

    // 5. recupera last_position_seconds per questa lezione
    const progress = await this.lessonProgressModel
      .findOne({ enrollmentId, lessonId })
      .exec();

    // 6. recupera sezioni + lezioni del corso per la sidebar
    const sections = await this.sectionRepository.find({
      where: { course: { id: enrollment.course.id } },
      relations: ['lessons'],
      order: { order: 'ASC' },
    });

    // 7. recupera tutti i lessonId completati per questo enrollment
    const completedProgress = await this.lessonProgressModel
      .find({ enrollmentId, completed: true })
      .select('lessonId')
      .exec();

    const completedLessonIds = completedProgress.map((p) => p.lessonId);

    return {
      videoUrl,
      last_position_seconds: progress?.last_position_seconds ?? 0,
      quizAnswers: progress?.quizAnswers
        ? progress.quizAnswers.map((a) => ({
            questionIndex: a.questionIndex,
            selectedLabel: a.selectedLabel,
            correct: a.correct,
          }))
        : [],
      quiz: (content.quiz ?? []).map((q) => ({
        question: q.question,
        options: q.options.map((o) => ({ label: o.label, text: o.text })),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ?? null,
      })),
      sections: sections.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        lessons: s.lessons
          .sort((a, b) => a.order - b.order)
          .map((l) => ({
            id: l.id,
            title: l.title,
            order: l.order,
            duration_seconds: l.duration_seconds,
          })),
      })),
      completedLessonIds,
    };
  }

  async updateLessonProgress(
    enrollmentId: string,
    lessonId: string,
    dto: UpdateLessonProgressDto,
  ): Promise<LessonProgressDocument> {
    const completed = dto.completed ?? false;

    const $set: Record<string, unknown> = {
      last_position_seconds: dto.last_position_seconds,
      completed,
    };

    if (dto.quizAnswers) {
      $set.quizAnswers = dto.quizAnswers;
    }

    if (completed) {
      $set.completedAt = new Date();
    }

    const progress = await this.lessonProgressModel
      .findOneAndUpdate(
        { enrollmentId, lessonId },
        { $set },
        { new: true, upsert: true },
      )
      .exec();

    if (completed) {
      await this.enrollmentsService.updateProgress(enrollmentId);
    }

    return progress.toObject() as LessonProgressDocument;
  }
}
