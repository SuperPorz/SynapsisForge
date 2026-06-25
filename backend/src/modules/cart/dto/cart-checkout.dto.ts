import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CartCheckoutDto {
  @IsString()
  @IsNotEmpty()
  nonce!: string;

  @IsNumber()
  @Min(0.01)
  total!: number;
}
