import { IsUUID } from 'class-validator';

export class CourseActionsDto {
  @IsUUID()
  id!: string;
}
