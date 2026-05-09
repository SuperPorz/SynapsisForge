// src/lessons/dto/update-lesson-content.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateLessonContentDto } from './create-lesson-content.dto';

// Tutti i campi di CreateLessonContentDto diventano opzionali.
// PartialType di @nestjs/swagger eredita anche i decoratori Swagger.
export class UpdateLessonContentDto extends PartialType(
  CreateLessonContentDto,
) {}
