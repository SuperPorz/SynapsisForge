import {
  IsString,
  IsUrl,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttachmentDto {
  @ApiProperty({ example: 'Slide del corso' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'https://cdn.example.com/file.pdf' })
  @IsUrl()
  url!: string;

  @ApiProperty({ example: 'pdf' })
  @IsString()
  @IsNotEmpty()
  type!: string;
}

export class QuizOptionDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ example: 'La risposta corretta' })
  @IsString()
  @IsNotEmpty()
  text!: string;
}

export class QuizItemDto {
  @ApiProperty({ example: "Cos'è TypeScript?" })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiProperty({ type: [QuizOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options!: QuizOptionDto[];

  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  correctAnswer!: string;
}

export class CreateLessonContentDto {
  // lessonId non è nel body della request: viene iniettato dal controller
  // tramite il parametro :id dell'URL, quindi non serve qui come campo pubblico.
  // Il service lo riceve separatamente.

  @ApiProperty({ example: 'https://cdn.example.com/video.mp4' })
  @IsUrl()
  videoUrl!: string;

  @ApiPropertyOptional({ example: 'Testo della trascrizione...' })
  @IsOptional()
  @IsString()
  transcript?: string | null;

  @ApiPropertyOptional({ type: [AttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiPropertyOptional({ type: [QuizItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizItemDto)
  quiz?: QuizItemDto[];
}
