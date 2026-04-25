import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Status } from '../../entities/enum/courses.enum';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;
}
