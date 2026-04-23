import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Status } from '../../entities/enum/courses.enum';

export class CreateCourseDto {
  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsString()
  description!: string;

  @IsNumber()
  price!: number;

  @IsString()
  category_id!: string;

  @IsEnum(Status)
  status!: Status;

  @IsString()
  thumbnail!: string;
}
