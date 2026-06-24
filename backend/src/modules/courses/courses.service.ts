// prettier-ignore
import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from 'src/common/entities/courses.entity';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Category } from 'src/common/entities/categories.entity';
import { CourseDetailResponseDto } from './dto/course-detail-response.dto';
import { plainToInstance } from 'class-transformer';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { Review } from 'src/common/entities/reviews.entity';
import { Lesson } from 'src/common/entities/lessons.entity';
import { LessonProgress } from 'src/modules/enrollments/schemas/lesson-progress.schema';
import { Section } from 'src/common/entities/section.entity';
import { InstructorProfile } from 'src/common/entities/instructor-profile.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CacheService } from 'src/modules/cache/cache.service';
import { RedisPubSubService } from 'src/modules/cache/redis-pubsub.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepo: Repository<Course>,

    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,

    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,

    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,

    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,

    @InjectRepository(InstructorProfile)
    private readonly instructorProfileRepo: Repository<InstructorProfile>,

    @InjectModel(LessonProgress.name, 'mongo_synapsis')
    private lessonProgressModel: Model<LessonProgress>,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly cacheService: CacheService,
    private readonly redisPubSub: RedisPubSubService,
  ) {}

  async findAll(
    page: number,
    limit: number,
    category?: string,
    featured?: boolean,
    q?: string,
    minPrice?: number,
    maxPrice?: number,
  ) {
    const cacheKey = `sf:cache:courses:list:${page}:${limit}:${category ?? ''}:${featured ?? ''}:${q ?? ''}:${minPrice ?? ''}:${maxPrice ?? ''}`;

    return this.cacheManager.wrap(
      cacheKey,
      async () => {
        const qb = this.coursesRepo
          .createQueryBuilder('course')
          .leftJoinAndSelect('course.instructor', 'instructor')
          .leftJoinAndSelect('instructor.user', 'user')
          .leftJoinAndSelect('course.category', 'category');

        if (category) {
          qb.andWhere('category.slug = :category', { category });
        }

        if (featured !== undefined) {
          qb.andWhere('course.featured = :featured', { featured });
        }

        if (q) {
          qb.andWhere(
            '(course.title ILIKE :q OR course.description ILIKE :q)',
            {
              q: `%${q}%`,
            },
          );
        }

        if (minPrice !== undefined) {
          qb.andWhere('course.price >= :minPrice', { minPrice });
        }

        if (maxPrice !== undefined) {
          qb.andWhere('course.price <= :maxPrice', { maxPrice });
        }

        const [data, total] = await qb
          .skip((page - 1) * limit)
          .take(limit)
          .getManyAndCount();

        const courseIds = data.map((c) => c.id);
        const avgRatings: { courseId: string; avg: string }[] = courseIds.length
          ? await this.reviewRepo
              .createQueryBuilder('review')
              .innerJoin('review.enrollment', 'enrollment')
              .select('enrollment."courseId"', 'courseId')
              .addSelect('AVG(review.rating)', 'avg')
              .where('enrollment."courseId" IN (:...courseIds)', { courseIds })
              .groupBy('enrollment."courseId"')
              .getRawMany()
          : [];

        const ratingMap: Record<string, number | null> = {};
        for (const row of avgRatings) {
          ratingMap[row.courseId] = Number(Number(row.avg).toFixed(1));
        }

        return {
          data: data.map((c) => ({
            ...c,
            rating: ratingMap[c.id] ?? null,
          })),
          total,
        };
      },
      300_000,
    );
  }

  //prettier-ignore
  async findOne(id: string): Promise<CourseDetailResponseDto> {
    return this.cacheManager.wrap(
      `sf:cache:course:${id}`,
      async () => {
        const course = await this.coursesRepo
          .createQueryBuilder('course')
          .leftJoinAndSelect('course.category', 'category')
          .leftJoinAndSelect('course.instructor', 'instructor')
          .leftJoinAndSelect('instructor.user', 'user')
          .leftJoinAndSelect('course.sections', 'sections')
          .leftJoinAndSelect('sections.lessons', 'lessons')
          .where('course.id = :id', { id })
          .orderBy('sections.order', 'ASC')
          .addOrderBy('lessons.order', 'ASC')
          .getOne();

        if (!course) throw new NotFoundException(`Course ${id} not found`);

        const avgResult = await this.reviewRepo
          .createQueryBuilder('review')
          .innerJoin('review.enrollment', 'enrollment')
          .where('enrollment.courseId = :courseId', { courseId: id })
          .select('AVG(review.rating)', 'avg')
          .getRawOne();

        const dto = plainToInstance(CourseDetailResponseDto, course, {
          excludeExtraneousValues: true,
        });
        dto.rating = avgResult?.avg ? Number(Number(avgResult.avg).toFixed(1)) : null;
        return dto;
      },
      600_000,
    );
  }

  async findBySlug(slug: string): Promise<Course> {
    return this.cacheManager.wrap(
      `sf:cache:course:slug:${slug}`,
      async () => {
        const course = await this.coursesRepo.findOne({
          where: { slug },
          relations: ['instructor', 'category'],
        });
        if (!course)
          throw new NotFoundException(`Course with slug ${slug} not found`);
        return course;
      },
      600_000,
    );
  }

  private async verifyOwnership(
    courseId: string,
    userId: string,
  ): Promise<Course> {
    const course = await this.coursesRepo.findOne({
      where: { id: courseId },
      relations: ['instructor'],
    });
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);
    if (course.instructor.userId !== userId) {
      throw new ForbiddenException('You do not own this course');
    }
    return course;
  }

  async create(dto: CreateCourseDto, userId: string): Promise<Course> {
    try {
      const course = this.coursesRepo.create({
        ...dto,
        instructor: { userId },
        category: { id: dto.category_id },
      });
      const saved = await this.coursesRepo.save(course);
      await this.cacheService.invalidateCourseList();
      return saved;
    } catch (err) {
      const pgError = err as { code?: string };
      if (pgError.code === '23505') {
        throw new ConflictException(`Course "${dto.title}" already exists`);
      }
      throw err;
    }
  }

  // metodi per l'update
  private async findOneEntity(id: string): Promise<Course | null> {
    const course = await this.coursesRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    return course;
  }

  async update(
    id: string,
    dto: UpdateCourseDto,
    userId: string,
  ): Promise<Course | null> {
    await this.verifyOwnership(id, userId);
    await this.coursesRepo.update({ id }, dto);
    const updated = await this.findOneEntity(id);
    await this.cacheService.invalidateCourse(id);
    return updated;
  }

  async delete(id: string, userId: string): Promise<{ message: string }> {
    const course = await this.verifyOwnership(id, userId);
    await this.coursesRepo.softDelete({ id });
    await this.cacheService.invalidateCourse(id);
    return {
      message: `Course "${course.title}" has been deactivated successfully`,
    };
  }

  async search(query: string): Promise<Course[]> {
    const courses = await this.coursesRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .leftJoinAndSelect('course.category', 'category')
      .where('course.title ILIKE :q', { q: `%${query}%` })
      .orWhere('course.description ILIKE :q', { q: `%${query}%` })
      .getMany();

    if (courses.length === 0) {
      throw new NotFoundException(`No courses found for query "${query}"`);
    }

    return courses;
  }

  async restore(id: string, userId: string): Promise<{ message: string }> {
    const course = await this.coursesRepo.findOne({
      where: { id },
      withDeleted: true,
      relations: ['instructor'],
    });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    if (course.instructor.userId !== userId) {
      throw new ForbiddenException('You do not own this course');
    }
    if (!course.deleted_at)
      throw new ConflictException(`Course "${course.title}" is already active`);
    await this.coursesRepo.restore({ id });
    await this.cacheService.invalidateCourse(id);
    return {
      message: `Course "${course.title}" has been restored successfully`,
    };
  }

  async getCategories(): Promise<Category[]> {
    return await this.categoriesRepo.find();
  }

  async findMyCourses(userId: string) {
    const courses = await this.coursesRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .where('instructor.userId = :userId', { userId })
      .orderBy('course.created_at', 'DESC')
      .getMany();

    const courseIds = courses.map((c) => c.id);

    const countMap: Record<string, number> = {};
    if (courseIds.length) {
      const redisCounts = await Promise.all(
        courseIds.map(async (id) => {
          const count = await this.redisPubSub.getEnrollmentCount(id);
          return { courseId: id, count };
        }),
      );

      const allFromRedis = redisCounts.every((r) => r.count > 0);
      if (allFromRedis) {
        for (const row of redisCounts) {
          countMap[row.courseId] = row.count;
        }
      } else {
        const rows = await this.enrollmentRepo
          .createQueryBuilder('enrollment')
          .select('enrollment."courseId"', 'courseId')
          .addSelect('COUNT(*)', 'count')
          .where('enrollment."courseId" IN (:...courseIds)', { courseIds })
          .groupBy('enrollment."courseId"')
          .getRawMany();
        for (const row of rows) {
          countMap[row.courseId] = Number(row.count);
        }
      }
    }

    const avgRatings: { courseId: string; avg: string }[] = courseIds.length
      ? await this.reviewRepo
          .createQueryBuilder('review')
          .innerJoin('review.enrollment', 'enrollment')
          .select('enrollment."courseId"', 'courseId')
          .addSelect('AVG(review.rating)', 'avg')
          .where('enrollment."courseId" IN (:...courseIds)', { courseIds })
          .groupBy('enrollment."courseId"')
          .getRawMany()
      : [];

    const ratingMap: Record<string, number | null> = {};
    for (const row of avgRatings) {
      ratingMap[row.courseId] = Number(Number(row.avg).toFixed(1));
    }

    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      price: Number(c.price),
      status: c.status,
      thumbnail_url: c.thumbnail_url,
      category: c.category?.name ?? null,
      enrollmentCount: countMap[c.id] ?? 0,
      rating: ratingMap[c.id] ?? null,
      created_at: c.created_at,
    }));
  }

  async getCourseStats(userId: string, courseId: string) {
    const course = await this.coursesRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .leftJoinAndSelect('course.category', 'category')
      .where('course.id = :courseId', { courseId })
      .andWhere('instructor.userId = :userId', { userId })
      .getOne();

    if (!course) throw new NotFoundException(`Course ${courseId} not found`);

    const redisCount = await this.redisPubSub.getEnrollmentCount(courseId);
    const enrollmentCount =
      redisCount > 0
        ? redisCount
        : await this.enrollmentRepo.count({
            where: { course: { id: courseId } },
          });

    const enrollmentIds = (
      await this.enrollmentRepo.find({
        where: { course: { id: courseId } },
        select: ['id'],
      })
    ).map((e) => e.id);

    const avgResult: { avg?: string | number } | null | undefined =
      enrollmentIds.length > 0
        ? await this.reviewRepo
            .createQueryBuilder('review')
            .where('review.enrollmentId IN (:...ids)', { ids: enrollmentIds })
            .select('AVG(review.rating)', 'avg')
            .getRawOne()
        : null;
    const averageRating = avgResult?.avg
      ? Number(Number(avgResult.avg).toFixed(1))
      : null;

    const lessons = await this.lessonRepo.find({
      where: { course: { id: courseId } },
    });

    const lessonIds = lessons.map((l) => l.id);
    const watchTimeAgg = lessonIds.length
      ? await this.lessonProgressModel
          .aggregate([
            { $match: { lessonId: { $in: lessonIds } } },
            {
              $group: { _id: null, total: { $sum: '$last_position_seconds' } },
            },
          ])
          .exec()
      : [];

    return {
      courseId: course.id,
      courseTitle: course.title,
      enrollmentCount,
      averageRating,
      totalWatchTimeSeconds: watchTimeAgg.length ? watchTimeAgg[0].total : 0,
    };
  }

  async getCourseLessonsWithStats(userId: string, courseId: string) {
    const course = await this.coursesRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .where('course.id = :courseId', { courseId })
      .andWhere('instructor.userId = :userId', { userId })
      .getOne();

    if (!course) throw new NotFoundException(`Course ${courseId} not found`);

    const lessons = await this.lessonRepo.find({
      where: { course: { id: courseId } },
      order: { order: 'ASC' },
    });

    if (!lessons.length) return [];

    const lessonIds = lessons.map((l) => l.id);

    const watchTimeAgg = await this.lessonProgressModel
      .aggregate([
        { $match: { lessonId: { $in: lessonIds } } },
        {
          $group: {
            _id: '$lessonId',
            totalWatchTime: { $sum: '$last_position_seconds' },
            completions: { $sum: { $cond: ['$completed', 1, 0] } },
          },
        },
      ])
      .exec();

    const statsMap: Record<
      string,
      { totalWatchTime: number; completions: number }
    > = {};
    for (const row of watchTimeAgg) {
      statsMap[row._id] = {
        totalWatchTime: row.totalWatchTime,
        completions: row.completions,
      };
    }

    return lessons.map((l) => ({
      lessonId: l.id,
      lessonTitle: l.title,
      order: l.order,
      durationSeconds: l.duration_seconds,
      totalWatchTimeSeconds: statsMap[l.id]?.totalWatchTime ?? 0,
      completionCount: statsMap[l.id]?.completions ?? 0,
    }));
  }

  async searchFilter(filters: {
    q?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Course[]> {
    const qb = this.coursesRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category');

    if (filters.q) {
      qb.andWhere('(course.title ILIKE :q OR course.description ILIKE :q)', {
        q: `%${filters.q}%`,
      });
    }

    if (filters.minPrice !== undefined) {
      qb.andWhere('course.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice !== undefined) {
      qb.andWhere('course.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    const courses = await qb.getMany();

    if (courses.length === 0) {
      throw new NotFoundException('No courses found for the given filters');
    }

    return courses;
  }

  // ---------------------------------------------------------------------------
  // Section CRUD
  // ---------------------------------------------------------------------------

  async createSection(
    courseId: string,
    dto: CreateSectionDto,
    userId: string,
  ): Promise<Section> {
    await this.verifyOwnership(courseId, userId);

    const maxOrder = await this.sectionRepo
      .createQueryBuilder('section')
      .where('section.courseId = :courseId', { courseId })
      .select('MAX(section.order)', 'max')
      .getRawOne();

    const section = this.sectionRepo.create({
      title: dto.title,
      order: dto.order ?? (maxOrder?.max ?? 0) + 1,
      course: { id: courseId },
    });
    const saved = await this.sectionRepo.save(section);
    await this.cacheService.invalidateCourse(courseId);
    return saved;
  }

  async updateSection(
    courseId: string,
    sectionId: string,
    dto: UpdateSectionDto,
    userId: string,
  ): Promise<Section> {
    await this.verifyOwnership(courseId, userId);
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId, course: { id: courseId } },
    });
    if (!section) throw new NotFoundException(`Section ${sectionId} not found`);

    Object.assign(section, dto);
    const saved = await this.sectionRepo.save(section);
    await this.cacheService.invalidateCourse(courseId);
    return saved;
  }

  async deleteSection(
    courseId: string,
    sectionId: string,
    userId: string,
  ): Promise<void> {
    await this.verifyOwnership(courseId, userId);
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId, course: { id: courseId } },
    });
    if (!section) throw new NotFoundException(`Section ${sectionId} not found`);

    await this.sectionRepo.remove(section);
    await this.cacheService.invalidateCourse(courseId);
  }

  async reorderSections(
    courseId: string,
    dto: ReorderSectionsDto,
    userId: string,
  ): Promise<Section[]> {
    await this.verifyOwnership(courseId, userId);

    const sections = await this.sectionRepo.find({
      where: { course: { id: courseId } },
    });

    const sectionMap = new Map(sections.map((s) => [s.id, s]));

    for (let i = 0; i < dto.sectionIds.length; i++) {
      const section = sectionMap.get(dto.sectionIds[i]);
      if (section) {
        section.order = i + 1;
      }
    }

    const saved = await this.sectionRepo.save(sections);
    await this.cacheService.invalidateCourse(courseId);
    return saved;
  }
}
