import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardEnrollmentDto {
  @ApiProperty({ example: 'uuid-enrollment-id' })
  id!: string;

  @ApiProperty({ example: 42 })
  progress_percent!: number;

  @ApiProperty({ example: '2026-05-01T10:00:00.000Z', nullable: true })
  completed_at!: Date | null;

  @ApiProperty({ example: '2026-05-01T09:00:00.000Z' })
  enrolled_at!: Date;

  @ApiProperty({ example: 'uuid-course-id' })
  courseId!: string;

  @ApiPropertyOptional({ example: 'Corso di Python' })
  courseTitle?: string;

  @ApiPropertyOptional({ example: 'python-basics' })
  courseSlug?: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg' })
  courseThumbnail?: string;

  @ApiPropertyOptional({ example: 'uuid-first-lesson-id' })
  firstLessonId?: string;

  @ApiProperty({ example: 'uuid-student-id' })
  studentId!: string;
}
