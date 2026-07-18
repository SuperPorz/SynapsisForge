//prettier-ignore
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNotFoundResponse, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { ParseUuidPipe } from 'src/common/pipes/parse-uuid.pipe';

@ApiTags('Lesson Player')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@ApiBadRequestResponse({ description: 'Validation failed or invalid input.' })
@Controller('enrollments/:enrollmentId/lessons')
export class LessonPlayerController {
  constructor(private readonly lessonsService: LessonsService) {}

  // -------------------------------------------------------------------------
  // GET /enrollments/:enrollmentId/lessons/:lessonId/video
  // Genera un signed URL S3 per lo studente iscritto, valido 3600s.
  // Verifica anche che l'enrollment esista prima di generare l'URL.
  // -------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get signed video URL for enrolled student' })
  @ApiResponse({
    status: 200,
    description: 'Signed URL generated successfully.',
  })
  @ApiNotFoundResponse({ description: 'Enrollment or lesson not found.' })
  @ApiParam({
    name: 'enrollmentId',
    description: 'UUID of the enrollment',
    type: String,
  })
  @ApiParam({
    name: 'lessonId',
    description: 'UUID of the lesson',
    type: String,
  })
  @Get(':lessonId/video')
  async getVideoUrl(
    @Param('enrollmentId', ParseUuidPipe) enrollmentId: string,
    @Param('lessonId', ParseUuidPipe) lessonId: string,
  ) {
    return this.lessonsService.getVideoUrl(enrollmentId, lessonId);
  }

  // -------------------------------------------------------------------------
  // PATCH /enrollments/:enrollmentId/lessons/:lessonId/progress
  // Aggiorna posizione video + flag completed su MongoDB (LessonProgress).
  // Se tutte le lezioni sono completate, EnrollmentsService emette
  // enrollment.completed e aggiorna progress_percent su PostgreSQL.
  // -------------------------------------------------------------------------
  @ApiOperation({ summary: 'Update lesson progress for enrolled student' })
  @ApiBody({ type: UpdateLessonProgressDto })
  @ApiResponse({ status: 200, description: 'Progress updated successfully.' })
  @ApiNotFoundResponse({ description: 'Enrollment or lesson not found.' })
  @ApiParam({
    name: 'enrollmentId',
    description: 'UUID of the enrollment',
    type: String,
  })
  @ApiParam({
    name: 'lessonId',
    description: 'UUID of the lesson',
    type: String,
  })
  @Patch(':lessonId/progress')
  async updateProgress(
    @Param('enrollmentId', ParseUuidPipe) enrollmentId: string,
    @Param('lessonId', ParseUuidPipe) lessonId: string,
    @Body() dto: UpdateLessonProgressDto,
  ) {
    return this.lessonsService.updateLessonProgress(
      enrollmentId,
      lessonId,
      dto,
    );
  }
}
