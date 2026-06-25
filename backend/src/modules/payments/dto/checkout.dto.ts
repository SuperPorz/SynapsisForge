import { IsUUID, IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CheckoutDto {
  @IsUUID()
  courseId!: string;

  @IsString()
  @IsNotEmpty()
  nonce!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;
}
