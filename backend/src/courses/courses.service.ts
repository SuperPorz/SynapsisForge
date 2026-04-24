import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/entities/courses.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepo: Repository<Course>,
  ) {}

  async findAll(page: number, limit: number, category?: string) {
    const where: FindOptionsWhere<Course> = {};
    if (category) where.category = { name: category };
    return await this.coursesRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      relations: ['instructor', 'category'],
    });
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.coursesRepo.findOneBy({ id });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    return course;
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
        instructor: { id: dto.instructor_id },
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

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    await this.coursesRepo.update({ id }, dto);
    return await this.findOne(id);
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
    return await this.coursesRepo
      .createQueryBuilder('course') //alias della tabella
      .where('course.title ILIKE :q', { q: `%${query}%` }) // ILIKE è il LIKE case-insensitive di PostgreSQL, :q (short per query) è un parametro bindato — protegge da SQL injection
      .orWhere('course.description ILIKE :q', { q: `%${query}%` })
      .getMany();
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
}
