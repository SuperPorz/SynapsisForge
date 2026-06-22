// prettier-ignore
import { ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/common/entities/courses.entity';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Category } from 'src/common/entities/categories.entity';
import { CourseDetailResponseDto } from './dto/course-detail-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepo: Repository<Course>,

    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
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
    const qb = this.coursesRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .leftJoinAndSelect('instructor.user', 'user')
      .leftJoinAndSelect('course.category', 'category');

    if (category) {
      qb.andWhere('category.name = :category', { category });
    }

    if (featured !== undefined) {
      qb.andWhere('course.featured = :featured', { featured });
    }

    if (q) {
      qb.andWhere('(course.title ILIKE :q OR course.description ILIKE :q)', {
        q: `%${q}%`,
      });
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

    return { data, total };
  }

  //prettier-ignore
  async findOne(id: string): Promise<CourseDetailResponseDto> {
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
    return plainToInstance(CourseDetailResponseDto, course, {
      excludeExtraneousValues: true,
    });
  }

  async findBySlug(slug: string): Promise<Course> {
    const course = await this.coursesRepo.findOne({
      where: { slug },
      relations: ['instructor', 'category'],
    });
    if (!course)
      throw new NotFoundException(`Course with slug ${slug} not found`);
    return course;
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    try {
      const course = this.coursesRepo.create({
        ...dto,
        instructor: { userId: dto.instructor_id },
        category: { id: dto.category_id },
      });
      return await this.coursesRepo.save(course);
    } catch (err) {
      const pgError = err as { code?: string }; // typeguard per accedere in sicurezza a code
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

  async update(id: string, dto: UpdateCourseDto): Promise<Course | null> {
    await this.coursesRepo.update({ id }, dto);
    return await this.findOneEntity(id);
  }

  async delete(id: string): Promise<{ message: string }> {
    const course = await this.coursesRepo.findOneBy({ id });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    await this.coursesRepo.softDelete({ id });
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

  async restore(id: string): Promise<{ message: string }> {
    const course = await this.coursesRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    if (!course.deleted_at)
      throw new ConflictException(`Course "${course.title}" is already active`);
    await this.coursesRepo.restore({ id });
    return {
      message: `Course "${course.title}" has been restored successfully`,
    };
  }

  async getCategories(): Promise<Category[]> {
    return await this.categoriesRepo.find();
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
}
