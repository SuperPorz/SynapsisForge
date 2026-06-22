import {
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
  IsNumber,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuizAnswerDto {
  @IsNumber()
  questionIndex!: number;

  @IsString()
  selectedLabel!: string;

  @IsBoolean()
  correct!: boolean;
}

export class UpdateLessonProgressDto {
  @IsInt()
  @Min(0)
  last_position_seconds!: number;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  @IsOptional()
  quizAnswers?: QuizAnswerDto[];
}
