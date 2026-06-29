import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CoursesService } from './courses.service';
import { Course } from 'src/common/entities/courses.entity';
import { Category } from 'src/common/entities/categories.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { Review } from 'src/common/entities/reviews.entity';
import { Lesson } from 'src/common/entities/lessons.entity';
import { Section } from 'src/common/entities/section.entity';
import { InstructorProfile } from 'src/common/entities/instructor-profile.entity';
import { CacheService } from 'src/modules/cache/cache.service';
import { RedisPubSubService } from 'src/modules/cache/redis-pubsub.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { plainToInstance } from 'class-transformer';
import { CourseDetailResponseDto } from './dto/course-detail-response.dto';

describe('CoursesService', () => {
  let service: CoursesService;

  const mockQueryBuilder = {
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

  const mockCourseRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCategoryRepo = {
    find: jest.fn(),
  };

  const mockEnrollmentRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockReviewRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockLessonRepo = {
    find: jest.fn(),
  };

  const mockSectionRepo = {};

  const mockInstructorProfileRepo = {};

  const mockLessonProgressModel = {
    aggregate: jest.fn(),
  };

  const mockCacheManager: jest.Mocked<
    Pick<Cache, 'get' | 'set' | 'del' | 'wrap'>
  > = {
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

  const USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const COURSE_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const CATEGORY_ID = 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  const mockCourse = {
    id: COURSE_ID,
    title: 'Test Course',
    slug: 'test-course',
    description: 'A test course',
    price: 29.99,
    status: 'PUBLISHED',
    thumbnail_url: 'https://example.com/thumb.jpg',
    featured: false,
    created_at: new Date('2026-01-01'),
    deleted_at: null,
    instructor: { userId: USER_ID },
    category: { id: CATEGORY_ID, name: 'Technology', slug: 'technology' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockCacheManager.wrap.mockImplementation(
      (_key: string, fn: () => unknown, _ttl?: number) => fn(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: mockCourseRepo },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: mockEnrollmentRepo,
        },
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(Lesson), useValue: mockLessonRepo },
        { provide: getRepositoryToken(Section), useValue: mockSectionRepo },
        {
          provide: getRepositoryToken(InstructorProfile),
          useValue: mockInstructorProfileRepo,
        },
        {
          provide: getModelToken('LessonProgress', 'mongo_synapsis'),
          useValue: mockLessonProgressModel,
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: CacheService, useValue: mockCacheService },
        { provide: RedisPubSubService, useValue: mockRedisPubSub },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  describe('findAll', () => {
    it('should return paginated courses with ratings', async () => {
      const courses = [
        {
          ...mockCourse,
          id: 'c1',
          title: 'Course 1',
          rating: null,
        },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([courses, 1]);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { courseId: 'c1', avg: '4.5' },
      ]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].rating).toBe(4.5);
      expect(result.total).toBe(1);
      expect(mockCacheManager.wrap).toHaveBeenCalled();
    });

    it('should apply category filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.findAll(1, 10, 'technology');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.slug = :category',
        { category: 'technology' },
      );
    });

    it('should apply search query filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.findAll(1, 10, undefined, undefined, 'react');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(course.title ILIKE :q OR course.description ILIKE :q)',
        { q: '%react%' },
      );
    });

    it('should handle empty course list', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return course detail with rating', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockCourse);
      mockQueryBuilder.getRawOne.mockResolvedValue({ avg: '4.5' });

      const result = await service.findOne(COURSE_ID);

      expect(result).toBeInstanceOf(CourseDetailResponseDto);
      expect(result.rating).toBe(4.5);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('course.id = :id', {
        id: COURSE_ID,
      });
    });

    it('should throw NotFoundException when course does not exist', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne(COURSE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return null rating when no reviews exist', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockCourse);
      mockQueryBuilder.getRawOne.mockResolvedValue({ avg: null });

      const result = await service.findOne(COURSE_ID);

      expect(result.rating).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return course by slug when found', async () => {
      mockCacheManager.wrap.mockImplementation((_key, fn) => fn());
      mockCourseRepo.findOne.mockResolvedValue(mockCourse);

      const result = await service.findBySlug('test-course');

      expect(result).toEqual(mockCourse);
      expect(mockCourseRepo.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-course' },
        relations: [
          'instructor',
          'instructor.user',
          'category',
          'sections',
          'sections.lessons',
        ],
      });
    });

    it('should throw NotFoundException when slug not found', async () => {
      mockCacheManager.wrap.mockImplementation((_key, fn) => fn());
      mockCourseRepo.findOne.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return cached result on cache hit', async () => {
      mockCacheManager.wrap.mockImplementation((_key, _fn, _ttl) =>
        Promise.resolve(mockCourse),
      );

      const result = await service.findBySlug('test-course');

      expect(result).toEqual(mockCourse);
      expect(mockCourseRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const createDto: CreateCourseDto = {
      title: 'New Course',
      slug: 'new-course',
      description: 'A brand new course',
      price: 19.99,
      category_id: CATEGORY_ID,
      status: 'DRAFT',
    };

    it('should create a course and invalidate cache', async () => {
      const savedCourse = {
        ...mockCourse,
        id: 'new-id',
        title: 'New Course',
        slug: 'new-course',
      };
      mockCourseRepo.create.mockReturnValue(savedCourse);
      mockCourseRepo.save.mockResolvedValue(savedCourse);

      const result = await service.create(createDto, USER_ID);

      expect(result).toEqual(savedCourse);
      expect(mockCourseRepo.create).toHaveBeenCalledWith({
        ...createDto,
        instructor: { userId: USER_ID },
        category: { id: CATEGORY_ID },
      });
      expect(mockCacheService.invalidateCourseList).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate slug', async () => {
      mockCourseRepo.create.mockReturnValue({ ...createDto });
      const pgError = new Error('duplicate key');
      (pgError as any).code = '23505';
      mockCourseRepo.save.mockRejectedValue(pgError);

      await expect(service.create(createDto, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should rethrow non-PostgreSQL errors', async () => {
      mockCourseRepo.create.mockReturnValue({ ...createDto });
      const genericError = new Error('connection failed');
      mockCourseRepo.save.mockRejectedValue(genericError);

      await expect(service.create(createDto, USER_ID)).rejects.toThrow(
        'connection failed',
      );
    });
  });

  describe('delete', () => {
    it('should delete course and invalidate cache', async () => {
      mockCourseRepo.findOne.mockResolvedValue(mockCourse);

      const result = await service.delete(COURSE_ID, USER_ID);

      expect(result).toEqual({
        message: 'Course "Test Course" has been deleted successfully',
      });
      expect(mockCourseRepo.findOne).toHaveBeenCalledWith({
        where: { id: COURSE_ID },
        relations: ['instructor'],
        withDeleted: true,
      });
      expect(mockCourseRepo.delete).toHaveBeenCalledWith({ id: COURSE_ID });
      expect(mockCacheService.invalidateCourse).toHaveBeenCalledWith(COURSE_ID);
    });

    it('should throw NotFoundException when course does not exist', async () => {
      mockCourseRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(COURSE_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not own course', async () => {
      mockCourseRepo.findOne.mockResolvedValue({
        ...mockCourse,
        instructor: { userId: 'other-user' },
      });

      await expect(service.delete(COURSE_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
