// prettier-ignore
import { ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/common/entities/courses.entity';
import { User } from 'src/common/entities/users.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { FilterUsersDto } from './dto/filter-users.dto';
import { Status } from 'src/common/entities/enum/courses.enum';
import { CourseActionsDto } from './dto/course-actions.dto';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { CacheService, CacheStats } from 'src/modules/cache/cache.service';

export interface AdminStats {
  total_users: number;
  users_by_role: { role: string; count: number }[];
  published_courses: number;
  monthly_revenue: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Course)
    private courseRepository: Repository<Course>,

    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,

    private readonly cacheService: CacheService,
  ) {}

  async getCacheStats(): Promise<CacheStats> {
    return this.cacheService.getCacheStats();
  }

  async find_users(filters: FilterUsersDto): Promise<User[]> {
    const where: FindOptionsWhere<User> = {}; // variabile tipizzata con il tipo di TypeOrm specifico per le condizioni di find()
    if (filters.role !== undefined) where.role = filters.role;
    if (filters.is_active !== undefined) where.is_active = filters.is_active;

    return this.userRepository.find({ where });
  }

  async approve(filters: CourseActionsDto): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: filters.id },
      relations: { instructor: true, category: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.status !== Status.PENDING) {
      throw new ForbiddenException(
        `Cannot approve a course with status: ${course.status}`,
      );
    }

    course.status = Status.PUBLISHED;
    return this.courseRepository.save(course); //importante il save: altrimenti la modifica non è persistente
  }

  async reject(filters: CourseActionsDto): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: filters.id },
      relations: { instructor: true, category: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.status !== Status.PENDING) {
      throw new ForbiddenException(
        `Cannot approve a course with status: ${course.status}`,
      );
    }

    course.status = Status.REJECTED;
    return this.courseRepository.save(course); //importante il save: altrimenti la modifica non è persistente
  }

  async findPendingCourses(): Promise<Course[]> {
    return this.courseRepository.find({
      where: { status: Status.PENDING },
      relations: ['instructor', 'instructor.user', 'category'],
    });
  }

  async stats(): Promise<AdminStats> {
    const total_users_raw = await this.userRepository
      .createQueryBuilder('user')
      .select('COUNT(user.id)', 'count')
      .getRawOne<{ count: string }>();

    const users_by_role = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('user.role')
      .getRawMany<{ role: string; count: string }>();

    const published_courses_raw = await this.courseRepository
      .createQueryBuilder('course')
      .select('COUNT(course.id)', 'count')
      .where('course.status = :status', { status: Status.PUBLISHED })
      .getRawOne<{ count: string }>();

    return {
      total_users: parseInt(total_users_raw?.count ?? '0'),
      users_by_role: users_by_role.map((row) => ({
        role: row.role,
        count: parseInt(row.count),
      })),
      published_courses: parseInt(published_courses_raw?.count ?? '0'),
      monthly_revenue: 0, // TODO: implementare quando disponibile entity Payment
    };
  }

  // METODO DA SPOSTARE NEL MODULE INSTRUCTOR
  async submit(filters: CourseActionsDto): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: filters.id },
      relations: { instructor: true, category: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.status === Status.DRAFT) {
      course.status = Status.PENDING;
      return this.courseRepository.save(course);
    } else {
      throw new ForbiddenException(
        `Cannot approve a course with status: ${course.status}`,
      );
    }
  }
}
