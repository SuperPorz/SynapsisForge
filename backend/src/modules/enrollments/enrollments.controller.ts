import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ResponseEnrollmentDto } from './dto/response-enrollment.dto';

@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

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
  @ApiBody({ type: UpdateProgressDto })
  @ApiResponse({
    status: 200,
    description: 'Progresso aggiornato',
    type: ResponseEnrollmentDto,
  })
  @ApiResponse({ status: 400, description: 'Il corso non ha lezioni' })
  @ApiResponse({ status: 404, description: 'Enrollment non trovato' })
  async updateProgress(
    @Param('id', ParseUUIDPipe) enrollmentId: string,
    @Body() dto: UpdateProgressDto,
  ): Promise<ResponseEnrollmentDto> {
    return this.enrollmentsService.updateProgress(enrollmentId, dto.lessonId);
  }
}
