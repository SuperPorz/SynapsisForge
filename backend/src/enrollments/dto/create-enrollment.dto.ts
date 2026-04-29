import { IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  courseId!: string;
}
