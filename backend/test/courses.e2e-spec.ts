import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { CoursesModule } from '../src/modules/courses/courses.module';
import { Course } from '../src/common/entities/courses.entity';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '../src/common/interceptors/loggin.interceptor';
import { TimeoutInterceptor } from '../src/common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

// ---------------------------------------------------------------------------
// UUID v4 validi — necessari perché il controller usa ParseUUIDPipe
// ---------------------------------------------------------------------------

const COURSE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const INSTRUCTOR_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const CATEGORY_ID = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const NONEXISTENT_ID = '00000000-0000-4000-8000-000000000000';

// ---------------------------------------------------------------------------
// Dati fittizi riutilizzati nei test
// ---------------------------------------------------------------------------

const mockCourse: Partial<Course> = {
  id: COURSE_ID,
  title: 'NestJS Avanzato',
  description: 'Corso completo su NestJS',
  slug: 'nestjs-avanzato',
};

// ---------------------------------------------------------------------------
// Mock del repository — nessuna connessione reale al DB
// ---------------------------------------------------------------------------

const mockCoursesRepo = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  createQueryBuilder: jest.fn(),
};

// ---------------------------------------------------------------------------
// Setup del modulo di test
// ---------------------------------------------------------------------------

describe('Courses (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CoursesModule],
    })
      // Sostituisce il repository reale con il mock
      .overrideProvider(getRepositoryToken(Course))
      .useValue(mockCoursesRepo)
      .compile();

    app = moduleFixture.createNestApplication();

    // Replica esatta del bootstrap in main.ts
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

  // Azzera i mock prima di ogni test per evitare interferenze tra casi
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // GET /courses
  // ---------------------------------------------------------------------------

  describe('GET /courses', () => {
    it('dovrebbe restituire una lista paginata di corsi', async () => {
      mockCoursesRepo.findAndCount.mockResolvedValue([[mockCourse], 1]);

      const res = await request(app.getHttpServer())
        .get('/courses')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(mockCoursesRepo.findAndCount).toHaveBeenCalledTimes(1);
    });

    it('dovrebbe filtrare per categoria se il query param è presente', async () => {
      mockCoursesRepo.findAndCount.mockResolvedValue([[mockCourse], 1]);

      await request(app.getHttpServer())
        .get('/courses')
        .query({ page: 1, limit: 10, category: 'backend' })
        .expect(200);

      // Verifica che il repository sia stato chiamato con il filtro categoria
      const callArgs = mockCoursesRepo.findAndCount.mock.calls[0][0];
      expect(callArgs.where.category).toEqual({ name: 'backend' });
    });
  });

  // ---------------------------------------------------------------------------
  // GET /courses/:id
  // ---------------------------------------------------------------------------

  describe('GET /courses/:id', () => {
    it('dovrebbe restituire il corso se esiste', async () => {
      mockCoursesRepo.findOne.mockResolvedValue(mockCourse);

      const res = await request(app.getHttpServer())
        .get(`/courses/${COURSE_ID}`)
        .expect(200);

      expect(res.body.data.id).toBe(COURSE_ID);
    });

    it('dovrebbe restituire 404 se il corso non esiste', async () => {
      mockCoursesRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/courses/${NONEXISTENT_ID}`)
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /courses — test della ValidationPipe
  // ---------------------------------------------------------------------------

  describe('POST /courses', () => {
    it('dovrebbe bloccare un payload senza i campi obbligatori', async () => {
      // Payload vuoto: la ValidationPipe deve rispondere 400
      await request(app.getHttpServer()).post('/courses').send({}).expect(400);
    });

    it('dovrebbe bloccare un payload con campi non dichiarati nel DTO (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .send({
          title: 'Corso Test',
          campoInventato: 'valore non permesso',
        })
        .expect(400);
    });

    it('dovrebbe creare il corso se il payload è valido', async () => {
      mockCoursesRepo.create.mockReturnValue(mockCourse);
      mockCoursesRepo.save.mockResolvedValue(mockCourse);

      await request(app.getHttpServer())
        .post('/courses')
        .send({
          title: 'NestJS Avanzato',
          description: 'Corso completo su NestJS',
          slug: 'nestjs-avanzato',
          instructor_id: INSTRUCTOR_ID,
          category_id: CATEGORY_ID,
          price: 99.99,
          thumbnail_url: 'https://example.com/thumbnail.jpg',
        })
        .expect(201);
    });
  });
});
