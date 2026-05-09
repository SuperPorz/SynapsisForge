import { PartialType } from '@nestjs/swagger';
import { CreateLessonDto } from './create-lesson.dto';

// PartialType di @nestjs/swagger eredita sia i validatori di class-validator
// sia i decoratori Swagger, rendendo tutti i campi opzionali.
export class UpdateLessonDto extends PartialType(CreateLessonDto) {}
