import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Status } from '../entities/enum/courses.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'The title of the course',
    example: 'Introduction to Programming',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'The slug of the course',
    example: 'introduction-to-programming',
  })
  @IsString()
  slug!: string;

  @ApiProperty({
    description: 'The description of the course',
    example:
      'This course provides an introduction to programming concepts and techniques.',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'The price of the course',
    example: 99.99,
  })
  @IsNumber()
  price!: number;

  @ApiProperty({
    description: 'The UUID of the category to which the course belongs',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  category_id!: string;

  @IsEnum(Status)
  status!: Status;

  @ApiProperty({
    description: 'The thumbnail URL of the course',
    example: 'https://example.com/thumbnail.jpg',
  })
  @IsString()
  thumbnail!: string;
}
