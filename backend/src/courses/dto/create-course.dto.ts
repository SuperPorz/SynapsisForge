import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { Category } from '../../orm/categories.entity';

export class CreateCourseDto {
  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsString()
  description!: string;

  @IsNumber()
  price!: number;

  @IsEnum(Category)
  category!: Category;

  @IsDate()
  created_at!: Date;
}
