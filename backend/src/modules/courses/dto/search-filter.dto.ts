import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class SearchFilterDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;
}
