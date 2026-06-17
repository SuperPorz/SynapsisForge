import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateLessonProgressDto {
  @IsInt()
  @Min(0)
  last_position_seconds!: number;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
