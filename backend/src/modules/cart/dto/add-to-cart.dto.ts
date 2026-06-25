import { IsUUID } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  courseId!: string;
}
