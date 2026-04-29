// prettier-ignore
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/entities/courses.entity';
import { Enrollment } from 'src/entities/enrollments.entity';
import { Repository } from 'typeorm';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { StudentProfile } from 'src/entities/StudentProfile.entity';
import { Status as CourseStatus } from '../entities/enum/courses.enum';
import { Status as PaymentStatus } from '../entities/enum/payments.enum';
import { Payment } from 'src/entities/payments.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LessonProgress } from 'src/enrollments/schemas/lesson-progress.schema';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,

    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,

    @InjectRepository(StudentProfile)
    private studentProfileRepository: Repository<StudentProfile>,

    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectModel(LessonProgress.name, 'mongo_synapsis')
    private lessonProgressModel: Model<LessonProgress>,
  ) {}

  async enroll(dto: CreateEnrollmentDto): Promise<Enrollment> {
    // 1. Verifica che lo StudentProfile esista
    const studentProfile = await this.studentProfileRepository.findOne({
      where: { userId: dto.userId },
    });
    if (!studentProfile) {
      throw new NotFoundException(
        `StudentProfile not found for user ${dto.userId}`,
      );
    }

    // 2. Verifica che il corso esista e sia pubblicato
    const course = await this.courseRepository.findOne({
      where: { id: dto.courseId },
    });
    if (!course) {
      throw new NotFoundException(`Course ${dto.courseId} not found`);
    }
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException(
        `Course "${course.title}" is not available for enrollment`,
      );
    }

    // 3. Verifica che esista un pagamento completato per questo corso
    const payment = await this.paymentRepository.findOne({
      where: {
        user: { id: dto.userId },
        course: { id: dto.courseId },
        status: PaymentStatus.COMPLETED,
      },
    });
    if (!payment) {
      throw new ForbiddenException(
        `No completed payment found for this course`,
      );
    }

    // 4. Verifica che non esista già un'iscrizione (duplicato)
    const existing = await this.enrollmentRepository.findOne({
      where: {
        student: { userId: dto.userId },
        course: { id: dto.courseId },
      },
    });
    if (existing) {
      throw new ConflictException(`User is already enrolled in this course`);
    }

    // 5. Crea e salva l'enrollment
    const enrollment = this.enrollmentRepository.create({
      student: studentProfile,
      course: course,
      progress_percent: 0, // int NOT NULL — inizializzato a 0
    });

    return this.enrollmentRepository.save(enrollment);
  }

  // prettier-ignore
  async updateProgress(enrollmentId: string, lessonId: string): Promise<Enrollment> {
  // 1. Carica l'enrollment con le relazioni necessarie
  const enrollment = await this.enrollmentRepository.findOne({
    where: { id: enrollmentId },
    relations: ['course', 'course.lessons'],
  });
  if (!enrollment) {
    throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
  }

  const totalLessons = enrollment.course.lessons?.length ?? 0;
  if (totalLessons === 0) {
    throw new BadRequestException(`Course has no lessons`);
  }

  // 2. Salva la lezione completata in MongoDB (upsert — evita duplicati)
  await this.lessonProgressModel.updateOne(
    { enrollmentId, lessonId },
    { enrollmentId, lessonId, completedAt: new Date() },
    { upsert: true },
  );

  // 3. Conta le lezioni completate per questo enrollment
  const completedCount = await this.lessonProgressModel.countDocuments({ enrollmentId });

  // 4. Ricalcola il progresso
  const percent = Math.round((completedCount / totalLessons) * 100);
  enrollment.progress_percent = Math.min(100, percent);

  // 5. Se completato al 100%, segna la data
  if (enrollment.progress_percent === 100 && !enrollment.completed_at) {
    enrollment.completed_at = new Date();
    // qui andrà l'EventEmitter2 per il certificato (Giorno 21)
  }

  return this.enrollmentRepository.save(enrollment);
}
}
