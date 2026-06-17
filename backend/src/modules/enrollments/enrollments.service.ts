// prettier-ignore
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/common/entities/courses.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { Repository } from 'typeorm';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { StudentProfile } from 'src/common/entities/student-profile.entity';
import { Status as CourseStatus } from '../../common/entities/enum/courses.enum';
import { Status as PaymentStatus } from '../../common/entities/enum/payments.enum';
import { Payment } from 'src/common/entities/payments.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LessonProgress } from 'src/modules/enrollments/schemas/lesson-progress.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { ResponseEnrollmentDto } from './dto/response-enrollment.dto';

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

    private eventEmitter: EventEmitter2,
  ) {}

  // Helper per trasformare l'entità Enrollment in ResponseEnrollmentDto
  // usata sia in enroll che in updateProgress, per questo è privata ed esterna ai metodi, cosi da evitare ripetizioni
  private toDto(enrollment: Enrollment): ResponseEnrollmentDto {
    return plainToInstance(ResponseEnrollmentDto, enrollment, {
      excludeExtraneousValues: true,
    });
  }

  async findById(enrollmentId: string): Promise<Enrollment | null> {
    return await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['course'], // aggiunto per il lesson-service
    });
  }

  async enroll(dto: CreateEnrollmentDto): Promise<ResponseEnrollmentDto> {
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
    if (course.price > 0) {
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
      course,
      progress_percent: 0,
    });

    const saved = await this.enrollmentRepository.save(enrollment);
    return this.toDto(saved);
  }
  ///////////////////////////////////// UPDATE PROGRESS ///////////////////////////////////////////
  // prettier-ignore
  async updateProgress(enrollmentId: string): Promise<ResponseEnrollmentDto> {
    // 1. Carica l'enrollment con le relazioni necessarie
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['course', 'course.lessons', 'student'],
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
    }

    const totalLessons = enrollment.course.lessons?.length ?? 0;
    if (totalLessons === 0) {
      throw new BadRequestException(`Course has no lessons`);
    }

    // 2. Salva la lezione completata in MongoDB (upsert — evita duplicati)
    // rimosso perchè va nel modulo lessons
    
    /* await this.lessonProgressModel.updateOne(
      { enrollmentId, lessonId },
      { enrollmentId, lessonId, completedAt: new Date() },
      { upsert: true },
    ); */

    // 3. Conta le lezioni completate per questo enrollment
    const completedCount = await this.lessonProgressModel.countDocuments({ enrollmentId });

    // 4. Ricalcola il progresso
    const percent = Math.round((completedCount / totalLessons) * 100);
    enrollment.progress_percent = Math.min(100, percent);

    // 5. Se completato al 100%, segna la data ed emetti l'evento
    if (enrollment.progress_percent === 100 && !enrollment.completed_at) {
      enrollment.completed_at = new Date();
      this.eventEmitter.emit('enrollment.completed', { enrollmentId: enrollment.id });
    }

    const saved = await this.enrollmentRepository.save(enrollment);
    return this.toDto(saved);
  }

  //////// get specific enrollment ///////////////
  async findMyEnrollment(
    userId: string,
    courseId: string,
  ): Promise<ResponseEnrollmentDto | null> {
    const query = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.student', 'student')
      .innerJoin('enrollment.course', 'course')
      .where('student.userId = :userId', { userId })
      .andWhere('course.id = :courseId', { courseId });

    const enrollment = await query.getOne();
    return enrollment ? this.toDto(enrollment) : null;
  }
}
