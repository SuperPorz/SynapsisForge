// prettier-ignore
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/common/entities/courses.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { Lesson } from 'src/common/entities/lessons.entity';
import { Repository, In } from 'typeorm';
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
import { DashboardEnrollmentDto } from './dto/dashboard-enrollment.dto';
import { RedisPubSubService } from 'src/modules/cache/redis-pubsub.service';

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

    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,

    @InjectModel(LessonProgress.name, 'mongo_synapsis')
    private lessonProgressModel: Model<LessonProgress>,

    private eventEmitter: EventEmitter2,
    private readonly redisPubSub: RedisPubSubService,
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
    // 1. Verifica che lo StudentProfile esista (auto-create se manca — supporta INSTRUCTOR/ADMIN)
    let studentProfile = await this.studentProfileRepository.findOne({
      where: { userId: dto.userId },
      relations: ['user'],
    });
    if (!studentProfile) {
      studentProfile = this.studentProfileRepository.create({
        userId: dto.userId,
      });
      studentProfile = await this.studentProfileRepository.save(studentProfile);
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

    this.eventEmitter.emit('enrollment.created', {
      enrollmentId: saved.id,
      userId: dto.userId,
      email: studentProfile.user.email,
      userName: `${studentProfile.user.first_name} ${studentProfile.user.last_name}`,
      courseId: course.id,
      courseTitle: course.title,
    });

    await this.redisPubSub.publish('sf:enrollments', {
      courseId: course.id,
      userId: dto.userId,
      timestamp: new Date().toISOString(),
    });

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
    const completedCount = await this.lessonProgressModel.countDocuments({ enrollmentId, completed: true });

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

  async findMyEnrolledCourseIds(userId: string): Promise<string[]> {
    const rows = await this.enrollmentRepository
      .createQueryBuilder('e')
      .innerJoin('e.student', 's')
      .innerJoin('e.course', 'c')
      .where('s.userId = :userId', { userId })
      .select('c.id', 'c_id')
      .getRawMany();
    return rows.map((r) => r.c_id);
  }

  async findMyActivity(userId: string): Promise<
    {
      lessonId: string;
      lessonTitle: string;
      courseTitle: string;
      courseId: string;
      completedAt: Date;
    }[]
  > {
    // 1. Get all enrollment IDs for this user
    const rows = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.student', 'student')
      .innerJoinAndSelect('enrollment.course', 'course')
      .where('student.userId = :userId', { userId })
      .select(['enrollment.id', 'course.id', 'course.title'])
      .getRawMany();

    if (!rows.length) return [];

    const enrollmentIds = rows.map((e) => e.enrollment_id);

    // 2. Query last 10 completed lessons from MongoDB
    const progresses = await this.lessonProgressModel
      .find({ enrollmentId: { $in: enrollmentIds }, completed: true })
      .sort({ completedAt: -1 })
      .limit(10)
      .exec();

    if (!progresses.length) return [];

    // 3. Map enrollmentId → course info
    const courseByEnrollmentId: Record<string, { title: string; id: string }> =
      {};
    for (const e of rows) {
      courseByEnrollmentId[e.enrollment_id] = {
        title: e.course_title,
        id: e.course_id,
      };
    }

    // 4. Fetch lesson titles from PG
    const lessonIds = progresses.map((p) => p.lessonId);
    const lessons = await this.lessonRepository.find({
      where: { id: In(lessonIds) },
    });
    const lessonMap = new Map(lessons.map((l) => [l.id, l.title]));

    return progresses.map((p) => ({
      lessonId: p.lessonId,
      lessonTitle: lessonMap.get(p.lessonId) ?? 'Lezione sconosciuta',
      courseTitle: courseByEnrollmentId[p.enrollmentId]?.title ?? '',
      courseId: courseByEnrollmentId[p.enrollmentId]?.id ?? '',
      completedAt: p.completedAt,
    }));
  }

  async findMyEnrollments(userId: string): Promise<DashboardEnrollmentDto[]> {
    const rows = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.student', 'student')
      .innerJoin('enrollment.course', 'course')
      .where('student.userId = :userId', { userId })
      .select([
        'enrollment.id',
        'enrollment.progress_percent',
        'enrollment.completed_at',
        'enrollment.enrolled_at',
        'course.id',
        'course.title',
        'course.slug',
        'course.thumbnail_url',
        'student.userId',
      ])
      .orderBy('enrollment.enrolled_at', 'DESC')
      .getRawMany();

    if (!rows.length) return [];

    // Fetch first lesson ID per course
    const courseIds = [...new Set<string>(rows.map((r) => r.course_id))];
    const firstLessons = await this.lessonRepository
      .createQueryBuilder('l')
      .where('l."courseId" IN (:...courseIds)', { courseIds })
      .andWhere('l.deleted_at IS NULL')
      .orderBy('l."order"', 'ASC')
      .getMany();

    const firstLessonByCourse: Record<string, string> = {};
    for (const fl of firstLessons) {
      if (!firstLessonByCourse[fl.courseId]) {
        firstLessonByCourse[fl.courseId] = fl.id;
      }
    }

    return rows.map((r) => {
      const dto = new DashboardEnrollmentDto();
      dto.id = r.enrollment_id;
      dto.progress_percent = r.enrollment_progress_percent;
      dto.completed_at = r.enrollment_completed_at ?? null;
      dto.enrolled_at = r.enrollment_enrolled_at;
      dto.courseId = r.course_id;
      dto.courseTitle = r.course_title;
      dto.courseSlug = r.course_slug;
      dto.courseThumbnail = r.course_thumbnail_url;
      dto.firstLessonId = firstLessonByCourse[r.course_id] ?? null;
      dto.studentId = r.student_userId;
      return dto;
    });
  }
}
