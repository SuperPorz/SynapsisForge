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

  // ─── GET  ────────────────────────────────────────────────────
  @Get('my')
  @ApiOperation({
    summary: "Restituisce l'enrollment dell'utente per un corso specifico",
  })
  @ApiQuery({ name: 'courseId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Enrollment trovato o null' })
  async getMyEnrollment(
    @Query('courseId') courseId: string,
    @Req() req: Request & { user: { id: string } },
  ): Promise<ResponseEnrollmentDto | null> {
    const userId = req.user['id'];
    return this.enrollmentsService.findMyEnrollment(userId, courseId);
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
