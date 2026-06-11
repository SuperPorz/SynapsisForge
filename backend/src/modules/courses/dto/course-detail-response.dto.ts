import { Expose, Type } from 'class-transformer';
import { CourseResponseDto } from './response-course.dto';

export class LessonDetailResponseDto {
  @Expose()
  id!: string;

  @Expose()
  title!: string;

  @Expose()
  order!: number;

  @Expose()
  duration_seconds!: number;
}

export class SectionDetailResponseDto {
  @Expose()
  id!: string;

  @Expose()
  title!: string;

  @Expose()
  order!: number;

  @Expose()
  @Type(() => LessonDetailResponseDto)
  lessons?: LessonDetailResponseDto[];
}

export class CourseDetailResponseDto extends CourseResponseDto {
  @Expose()
  @Type(() => SectionDetailResponseDto)
  sections?: SectionDetailResponseDto[];
}
