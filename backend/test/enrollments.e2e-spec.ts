import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getModelToken } from '@nestjs/mongoose';
import { Reflector } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EnrollmentsModule } from '../src/modules/enrollments/enrollments.module';
import { Enrollment } from '../src/common/entities/enrollments.entity';
import { Course } from '../src/common/entities/courses.entity';
import { StudentProfile } from '../src/common/entities/StudentProfile.entity';
import { Payment } from '../src/common/entities/payments.entity';
import { LessonProgress } from '../src/modules/enrollments/schemas/lesson-progress.schema';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '../src/common/interceptors/loggin.interceptor';
import { TimeoutInterceptor } from '../src/common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Status as CourseStatus } from '../src/common/entities/enum/courses.enum';
import { Status as PaymentStatus } from '../src/common/entities/enum/payments.enum';

// ---------------------------------------------------------------------------
// UUID v4 validi — necessari perché i DTO usano @IsUUID()
// ---------------------------------------------------------------------------

const STUDENT_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const COURSE_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const PAYMENT_ID = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const ENROLLMENT_ID = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

// ---------------------------------------------------------------------------
// Dati fittizi
// ---------------------------------------------------------------------------

const mockStudentProfile = { userId: STUDENT_USER_ID };

const mockCourse = {
  id: COURSE_ID,
  title: 'NestJS Avanzato',
  status: CourseStatus.PUBLISHED,
};

const mockPayment = {
  id: PAYMENT_ID,
  status: PaymentStatus.COMPLETED,
};

const mockEnrollment = {
  id: ENROLLMENT_ID,
  progress_percent: 0,
  completed_at: null,
  student: mockStudentProfile,
  course: mockCourse,
};

// ---------------------------------------------------------------------------
// Mock dei repository e del modello Mongoose
// ---------------------------------------------------------------------------

const mockEnrollmentRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockCourseRepo = {
  findOne: jest.fn(),
};

const mockStudentProfileRepo = {
  findOne: jest.fn(),
};

const mockPaymentRepo = {
  findOne: jest.fn(),
};

// Il modello Mongoose viene mockato con i metodi usati dal service
const mockLessonProgressModel = {
  updateOne: jest.fn(),
  countDocuments: jest.fn(),
};

// ---------------------------------------------------------------------------
// Payload riutilizzato in tutti i test POST /enrollments
// ---------------------------------------------------------------------------

const validPayload = {
  userId: STUDENT_USER_ID,
  courseId: COURSE_ID,
};

// ---------------------------------------------------------------------------
// Setup del modulo di test
// ---------------------------------------------------------------------------

describe('Enrollments (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      // EventEmitterModule.forRoot() registra EventEmitter2 con il token corretto internamente,
      // evitando di dover conoscere il token stringa usato da @nestjs/event-emitter
      imports: [EnrollmentsModule, EventEmitterModule.forRoot()],
    })
      .overrideProvider(getRepositoryToken(Enrollment))
      .useValue(mockEnrollmentRepo)
      .overrideProvider(getRepositoryToken(Course))
      .useValue(mockCourseRepo)
      .overrideProvider(getRepositoryToken(StudentProfile))
      .useValue(mockStudentProfileRepo)
      .overrideProvider(getRepositoryToken(Payment))
      .useValue(mockPaymentRepo)
      // Il token Mongoose include il nome della connessione usata nel service
      .overrideProvider(getModelToken(LessonProgress.name, 'mongo_synapsis'))
      .useValue(mockLessonProgressModel)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
      new LoggingInterceptor(),
      new TimeoutInterceptor(),
      new TransformInterceptor(),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // POST /enrollments
  // ---------------------------------------------------------------------------

  describe('POST /enrollments', () => {
    it('dovrebbe bloccare un payload senza i campi obbligatori', async () => {
      await request(app.getHttpServer())
        .post('/enrollments')
        .send({})
        .expect(400);
    });

    it('dovrebbe restituire 404 se lo StudentProfile non esiste', async () => {
      mockStudentProfileRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/enrollments')
        .send(validPayload)
        .expect(404);
    });

    it('dovrebbe restituire 404 se il corso non esiste', async () => {
      mockStudentProfileRepo.findOne.mockResolvedValue(mockStudentProfile);
      mockCourseRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/enrollments')
        .send(validPayload)
        .expect(404);
    });

    it('dovrebbe restituire 403 se non esiste un pagamento completato', async () => {
      mockStudentProfileRepo.findOne.mockResolvedValue(mockStudentProfile);
      mockCourseRepo.findOne.mockResolvedValue(mockCourse);
      mockPaymentRepo.findOne.mockResolvedValue(null); // nessun pagamento

      await request(app.getHttpServer())
        .post('/enrollments')
        .send(validPayload)
        .expect(403);
    });

    it('dovrebbe restituire 409 se lo studente è già iscritto', async () => {
      mockStudentProfileRepo.findOne.mockResolvedValue(mockStudentProfile);
      mockCourseRepo.findOne.mockResolvedValue(mockCourse);
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockEnrollmentRepo.findOne.mockResolvedValue(mockEnrollment); // già iscritto

      await request(app.getHttpServer())
        .post('/enrollments')
        .send(validPayload)
        .expect(409);
    });

    it("dovrebbe creare l'enrollment se tutti i controlli passano", async () => {
      mockStudentProfileRepo.findOne.mockResolvedValue(mockStudentProfile);
      mockCourseRepo.findOne.mockResolvedValue(mockCourse);
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockEnrollmentRepo.findOne.mockResolvedValue(null); // non ancora iscritto
      mockEnrollmentRepo.create.mockReturnValue(mockEnrollment);
      mockEnrollmentRepo.save.mockResolvedValue(mockEnrollment);

      await request(app.getHttpServer())
        .post('/enrollments')
        .send(validPayload)
        .expect(201);
    });
  });
});
