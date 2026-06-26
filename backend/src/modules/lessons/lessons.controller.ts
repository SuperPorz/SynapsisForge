import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseUuidPipe } from 'src/common/pipes/parse-uuid.pipe';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateLessonContentDto } from './dto/create-lesson-content.dto';
import { UpdateLessonContentDto } from './dto/update-lesson-content.dto';
import { UpdateS3KeyDto } from './dto/update-s3-key.dto';
import { UserRole } from 'src/common/entities/enum/users.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Lessons')
@ApiBadRequestResponse({ description: 'Validation failed or invalid input.' })
// Tutte le rotte sono sotto /courses/:courseId/lessons per rispettare la
// gerarchia delle risorse: una lezione appartiene sempre a un corso.
@Controller('courses/:courseId/lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // ---------------------------------------------------------------------------
  // GET /courses/:courseId/lessons/:id
  // Dettaglio lezione: dati PostgreSQL + contenuto MongoDB (video, quiz, ecc.)
  // ---------------------------------------------------------------------------
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson with content by lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Lesson not found.' })
  @Get(':id')
  async getLesson(
    @Param('courseId', ParseUuidPipe) courseId: string,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    // ✅ Nessuna logica nel controller: tutto delegato al service.
    return this.lessonsService.getLessonWithContent(courseId, id);
  }

  // ---------------------------------------------------------------------------
  // POST /courses/:courseId/lessons
  // Crea una nuova lezione nel corso (ruolo: instructor)
  // ---------------------------------------------------------------------------
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Add a lesson to a course (instructor only)' })
  @ApiCreatedResponse({ description: 'Lesson created successfully.' })
  @ApiNotFoundResponse({ description: 'Course not found.' })
  @Post()
  async createLesson(
    @Param('courseId', ParseUuidPipe) courseId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.createLesson(courseId, dto);
  }

  // ---------------------------------------------------------------------------
  // PATCH /courses/:courseId/lessons/:id
  // Aggiorna i metadati di una lezione (ruolo: instructor)
  // ---------------------------------------------------------------------------
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update a lesson (instructor only)' })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully.' })
  @ApiNotFoundResponse({ description: 'Lesson not found.' })
  @Patch(':id')
  async updateLesson(
    @Param('courseId', ParseUuidPipe) courseId: string,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.updateLesson(courseId, id, dto);
  }

  // ---------------------------------------------------------------------------
  // DELETE /courses/:courseId/lessons/:id
  // Soft delete di una lezione (ruolo: instructor o admin)
  // Risponde 204 No Content — nessun body da restituire.
  // ---------------------------------------------------------------------------
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a lesson (instructor or admin)' })
  @ApiNoContentResponse({ description: 'Lesson deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Lesson not found.' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLesson(
    @Param('courseId', ParseUuidPipe) courseId: string,
    @Param('id', ParseUuidPipe) id: string,
  ): Promise<void> {
    return this.lessonsService.softDeleteLesson(courseId, id);
  }

  // ---------------------------------------------------------------------------
  // POST /courses/:courseId/lessons/:id/content
  // Crea il documento MongoDB con video, quiz, allegati per una lezione.
  // Step separato rispetto alla creazione della lezione: l'instructor prima
  // definisce la struttura del corso (POST /lessons), poi arricchisce ogni
  // lezione con i contenuti multimediali (POST /lessons/:id/content).
  // ---------------------------------------------------------------------------
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Create content for a lesson (instructor only)' })
  @ApiCreatedResponse({ description: 'Lesson content created successfully.' })
  @ApiNotFoundResponse({ description: 'Lesson not found.' })
  @Post(':id/content')
  async createContent(
    @Param('courseId', ParseUuidPipe) courseId: string,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: CreateLessonContentDto,
  ) {
    // Verifica che la lezione esista in PostgreSQL prima di creare il documento
    // MongoDB — evita contenuti orfani senza una lezione corrispondente.
    await this.lessonsService.findLesson(courseId, id);
    return this.lessonsService.createContent(id, dto);
  }

  // ---------------------------------------------------------------------------
  // PATCH /courses/:courseId/lessons/:id/content
  // Aggiorna parzialmente il documento MongoDB esistente (videoUrl, quiz, ecc.)
  // ---------------------------------------------------------------------------
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update content for a lesson (instructor only)' })
  @ApiResponse({
    status: 200,
    description: 'Lesson content updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'Lesson or content not found.' })
  @Patch(':id/content')
  async updateContent(
    @Param('courseId', ParseUuidPipe) courseId: string,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateLessonContentDto,
  ) {
    //qui verifichiamo solo se la lezione esiste; se si, si procede alla riga successiva
    await this.lessonsService.findLesson(courseId, id);
    return this.lessonsService.updateContent(id, dto);
  }

  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({
    summary: 'Update S3 key for a lesson video (instructor only)',
  })
  @ApiResponse({ status: 200, description: 'S3 key updated successfully.' })
  @ApiNotFoundResponse({ description: 'Lesson content not found.' })
  @Patch(':id/s3-key')
  async updateS3Key(
    @Param('courseId', ParseUuidPipe) courseId: string,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateS3KeyDto,
  ) {
    await this.lessonsService.findLesson(courseId, id);
    return this.lessonsService.updateS3Key(id, dto.s3Key);
  }
}
