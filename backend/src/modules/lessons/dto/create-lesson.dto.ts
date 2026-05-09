// prettier-ignore
import { IsString, IsInt, IsNotEmpty, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ example: 'Introduzione a NestJS' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 1, description: 'Ordine della lezione nel corso' })
  @IsInt()
  @IsPositive()
  order!: number;

  @ApiPropertyOptional({ example: 3600, description: 'Durata in secondi' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  duration_seconds?: number;
}
