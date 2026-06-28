import { Test, TestingModule } from '@nestjs/testing';
import {
  CanActivate,
  ClassSerializerInterceptor,
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CoursesController } from '../src/modules/courses/courses.controller';
import { CoursesService } from '../src/modules/courses/courses.service';
import { Course } from '../src/common/entities/courses.entity';
import { Category } from '../src/common/entities/categories.entity';
import { Section } from '../src/common/entities/section.entity';
import { Enrollment } from '../src/common/entities/enrollments.entity';
import { Review } from '../src/common/entities/reviews.entity';
import { Lesson } from '../src/common/entities/lessons.entity';
import { InstructorProfile } from '../src/common/entities/instructor-profile.entity';
import { UserRole } from '../src/common/entities/enum/users.enum';
import { CacheService } from '../src/modules/cache/cache.service';
import { RedisPubSubService } from '../src/modules/cache/redis-pubsub.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '../src/common/interceptors/loggin.interceptor';
import { TimeoutInterceptor } from '../src/common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import type { NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Shared UUIDs
// ---------------------------------------------------------------------------

const INSTRUCTOR_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const STUDENT_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const CATEGORY_ID = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

// ---------------------------------------------------------------------------
// Shared query builder mock
// ---------------------------------------------------------------------------

const mockQb = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
  getOne: jest.fn(),
  getRawMany: jest.fn(),
  getRawOne: jest.fn(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  withDeleted: jest.fn().mockReturnThis(),
};

// ---------------------------------------------------------------------------
// Repository & service mocks
// ---------------------------------------------------------------------------

const mockCourseRepo = {
  createQueryBuilder: jest.fn(() => mockQb),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAndCount: jest.fn(),
};

const mockCategoryRepo = {
  findOneBy: jest.fn(),
  find: jest.fn(),
};

const mockSectionRepo = {
  createQueryBuilder: jest.fn(() => mockQb),
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
};

const mockEnrollmentRepo = {
  createQueryBuilder: jest.fn(() => mockQb),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
};

const mockReviewRepo = {
  createQueryBuilder: jest.fn(() => mockQb),
};

const mockLessonRepo = {
  find: jest.fn(),
};

const mockInstructorProfileRepo = {
  findOne: jest.fn(),
};

const mockLessonProgressModel = {
  aggregate: jest.fn(),
};

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  wrap: jest.fn(),
};

const mockCacheService = {
  invalidateCourseList: jest.fn(),
  invalidateCourse: jest.fn(),
};

const mockRedisPubSub = {
  getEnrollmentCount: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test guard: simulates JwtAuthGuard + RolesGuard without Passport
// ---------------------------------------------------------------------------

class TestAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { role: UserRole } }>();
    if (!user) throw new UnauthorizedException();

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException();
    }
    return true;
  }
}

// ---------------------------------------------------------------------------
// Mutable user — changes per test to simulate different roles
// ---------------------------------------------------------------------------

let currentUser: { id: string; role: string } | null = null;

describe('Courses — role-based access (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: mockCourseRepo },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(Section), useValue: mockSectionRepo },
        { provide: getRepositoryToken(Enrollment), useValue: mockEnrollmentRepo },
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(Lesson), useValue: mockLessonRepo },
        { provide: getRepositoryToken(InstructorProfile), useValue: mockInstructorProfileRepo },
        { provide: getModelToken('LessonProgress', 'mongo_synapsis'), useValue: mockLessonProgressModel },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: CacheService, useValue: mockCacheService },
        { provide: RedisPubSubService, useValue: mockRedisPubSub },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Express middleware: injects req.user before guards run
    app.use((req: any, _res: Response, next: NextFunction) => {
      req.user = currentUser;
      next();
    });

    // Global guard — replaces JwtAuthGuard + RolesGuard
    app.useGlobalGuards(new TestAuthGuard(app.get(Reflector)));

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
  // GET /courses — public endpoint, should work without auth
  // ---------------------------------------------------------------------------

  describe('GET /courses', () => {
    it('should return 200 for unauthenticated request (public endpoint)', async () => {
      currentUser = null;

      mockCacheManager.wrap.mockImplementation(
        (_key: string, fn: () => unknown) => fn(),
      );
      mockQb.getManyAndCount.mockResolvedValue([[{ id: 'c1', title: 'Test' }], 1]);
      mockQb.getRawMany.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/courses')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.data).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // POST /courses — @Roles(INSTRUCTOR), tests three auth scenarios
  // ---------------------------------------------------------------------------

  describe('POST /courses', () => {
    const validPayload = {
      title: 'New Course',
      description: 'Course description',
      slug: 'new-course',
      category_id: CATEGORY_ID,
      price: 49.99,
    };

    it('should return 401 for unauthenticated request (no user)', async () => {
      currentUser = null;

      await request(app.getHttpServer())
        .post('/courses')
        .send(validPayload)
        .expect(401);
    });

    it('should return 403 for student role', async () => {
      currentUser = { id: STUDENT_ID, role: 'STUDENT' };

      await request(app.getHttpServer())
        .post('/courses')
        .send(validPayload)
        .expect(403);
    });

    it('should return 201 for instructor role and call service correctly', async () => {
      currentUser = { id: INSTRUCTOR_ID, role: 'INSTRUCTOR' };

      mockCourseRepo.create.mockReturnValue({ id: 'new-course-id' });
      mockCourseRepo.save.mockResolvedValue({ id: 'new-course-id', title: 'New Course' });

      const res = await request(app.getHttpServer())
        .post('/courses')
        .send(validPayload)
        .expect(201);

      expect(mockCourseRepo.create).toHaveBeenCalledWith({
        ...validPayload,
        status: 'DRAFT',
        thumbnail_url: undefined,
        instructor: { userId: INSTRUCTOR_ID },
        category: { id: validPayload.category_id },
      });
      expect(mockCourseRepo.save).toHaveBeenCalled();
      expect(mockCacheService.invalidateCourseList).toHaveBeenCalled();
      expect(res.body.data.id).toBe('new-course-id');
    });
  });
});
