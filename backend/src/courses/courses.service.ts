import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/orm/courses.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

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
    const course = this.coursesRepo.create(dto);
    return await this.coursesRepo.save(course);
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    await this.coursesRepo.update({ id }, dto);
    return await this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.coursesRepo.delete({ id });
  }

  async search(query: string): Promise<Course[]> {
    return await this.coursesRepo
      .createQueryBuilder('course') //alias della tabella
      .where('course.title ILIKE :q', { q: `%${query}%` }) // ILIKE è il LIKE case-insensitive di PostgreSQL, :q (short per query) è un parametro bindato — protegge da SQL injection
      .orWhere('course.description ILIKE :q', { q: `%${query}%` })
      .getMany();
  }
}

/* 
findAll
findOne
findBySlug
create
update
delete
search
*/
