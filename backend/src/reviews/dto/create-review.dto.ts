import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Rating } from 'src/common/entities/enum/reviews.enum';

export class CreateReviewDto {
  @IsUUID()
  enrollmentId!: string;

  @IsEnum(Rating)
  rating!: Rating;

  @IsOptional()
  @IsString()
  comment?: string;
}
