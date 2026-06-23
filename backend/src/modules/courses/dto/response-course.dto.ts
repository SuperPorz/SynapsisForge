import { Expose, Type } from 'class-transformer';

export class InstructorUserDto {
  @Expose()
  first_name: string;

  @Expose()
  last_name: string;

  @Expose()
  email: string;
}

export class InstructorResponseDto {
  @Expose()
  @Type(() => InstructorUserDto)
  user: InstructorUserDto;
}

export class CategoryResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;
}

export class CourseResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  slug: string;

  @Expose()
  description: string;

  @Type(() => Number)
  @Expose()
  price: number;

  @Expose()
  status: string;

  @Expose()
  thumbnail_url: string;

  @Expose()
  featured: boolean;

  @Expose()
  created_at: Date;

  @Expose()
  @Type(() => CategoryResponseDto)
  category: CategoryResponseDto;

  @Expose()
  @Type(() => InstructorResponseDto)
  instructor: InstructorResponseDto;

  @Expose()
  rating?: number | null;
}
