//prettier-ignore
import { Body, Controller, Param, Patch, Post, HttpCode, HttpStatus, ParseUUIDPipe, Get, Req, Query } from '@nestjs/common';
//prettier-ignore
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery, } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { ResponseEnrollmentDto } from './dto/response-enrollment.dto';
import { Request } from 'express';

@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  // ─── GET /enrollments/my  ─────────────────────────────────────
  @Get('my')
  @ApiOperation({
    summary:
      "Restituisce l'enrollment per un corso specifico (se courseId fornito) o tutti gli enrollments dell'utente",
  })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Enrollment trovato o lista' })
  async getMyEnrollment(
    @Query('courseId') courseId: string | undefined,
    @Req() req: Request & { user: { id: string } },
  ) {
    const userId = req.user['id'];
    if (courseId) {
      return this.enrollmentsService.findMyEnrollment(userId, courseId);
    }
    return this.enrollmentsService.findMyEnrollments(userId);
  }

  // ─── GET /enrollments/my/ids ─────────────────────────────────
  @Get('my/ids')
  @ApiOperation({
    summary: "Restituisce gli ID dei corsi a cui l'utente è iscritto",
  })
  async getMyEnrolledCourseIds(
    @Req() req: Request & { user: { id: string } },
  ): Promise<string[]> {
    return this.enrollmentsService.findMyEnrolledCourseIds(req.user['id']);
  }

  // ─── GET /enrollments/my/activity ────────────────────────────
  @Get('my/activity')
  @ApiOperation({ summary: "Ultime 10 lezioni completate dall'utente" })
  @ApiResponse({ status: 200, description: 'Attività recente' })
  async getMyActivity(@Req() req: Request & { user: { id: string } }) {
    const userId = req.user['id'];
    return this.enrollmentsService.findMyActivity(userId);
  }

  // ─── POST /enrollments ────────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iscrive uno studente a un corso' })
  @ApiBody({ type: CreateEnrollmentDto })
  @ApiResponse({
    status: 201,
    description: 'Iscrizione creata',
    type: ResponseEnrollmentDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Corso non disponibile o senza lezioni',
  })
  @ApiResponse({
    status: 403,
    description: 'Nessun pagamento completato trovato',
  })
  @ApiResponse({
    status: 404,
    description: 'StudentProfile o corso non trovato',
  })
  @ApiResponse({ status: 409, description: 'Studente già iscritto al corso' })
  async enroll(
    @Body() dto: CreateEnrollmentDto,
  ): Promise<ResponseEnrollmentDto> {
    return this.enrollmentsService.enroll(dto);
  }

  // ─── PATCH /enrollments/:id/progress ─────────────────────────────────────
  @ApiBearerAuth()
  @Patch(':id/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aggiorna il progresso di una lezione completata' })
  @ApiParam({ name: 'id', description: "UUID dell'enrollment", type: String })
  @ApiResponse({
    status: 200,
    description: 'Progresso aggiornato',
    type: ResponseEnrollmentDto,
  })
  @ApiResponse({ status: 400, description: 'Il corso non ha lezioni' })
  @ApiResponse({ status: 404, description: 'Enrollment non trovato' })
  async updateProgress(
    @Param('id', ParseUUIDPipe) enrollmentId: string,
  ): Promise<ResponseEnrollmentDto> {
    return this.enrollmentsService.updateProgress(enrollmentId);
  }
}
