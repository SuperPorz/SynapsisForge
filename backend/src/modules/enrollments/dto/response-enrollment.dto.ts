// dto/response-enrollment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class ResponseEnrollmentDto {
  @ApiProperty({ example: 'uuid-enrollment-id' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 42 })
  @Expose()
  progress_percent!: number;

  @ApiProperty({ example: '2026-05-01T10:00:00.000Z', nullable: true })
  @Expose()
  completed_at!: Date | null;

  @ApiProperty({ example: '2026-05-01T09:00:00.000Z' })
  @Expose()
  enrolled_at!: Date;

  @ApiProperty({ example: 'uuid-course-id' })
  @Expose()
  @Transform(({ obj }: { obj: { course?: { id: string } } }) => obj.course?.id)
  courseId!: string;

  @ApiProperty({ example: 'uuid-student-id' })
  @Expose()
  @Transform(
    ({ obj }: { obj: { student?: { userId: string } } }) => obj.student?.userId,
  )
  studentId!: string;
}
