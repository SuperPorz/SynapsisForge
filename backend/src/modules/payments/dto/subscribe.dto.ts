import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { SubscriptionPlan } from 'src/common/entities/enum/users.enum';

export class SubscribeDto {
  @IsString()
  @IsNotEmpty()
  nonce!: string;

  @IsString()
  @IsNotEmpty()
  planId!: string;

  @IsOptional()
  @IsEnum(SubscriptionPlan)
  plan?: SubscriptionPlan;
}
