//prettier-ignore
import { Body, Controller, Param, Patch, Post, HttpCode, HttpStatus, ParseUUIDPipe, Get, Req, Query } from '@nestjs/common';
//prettier-ignore
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery, ApiUnauthorizedResponse, } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { ResponseEnrollmentDto } from './dto/response-enrollment.dto';
import { Request } from 'express';

@ApiTags('Enrollments')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  // ─── GET /enrollments/my  ─────────────────────────────────────
  @Get('my')
  @ApiOperation({
    summary:
      'Get enrollment for a specific course (if courseId provided) or all user enrollments',
  })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Enrollment found or list of enrollments',
  })
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
    summary: 'Get IDs of courses the user is enrolled in',
  })
  @ApiResponse({ status: 200, description: 'List of course IDs.' })
  async getMyEnrolledCourseIds(
    @Req() req: Request & { user: { id: string } },
  ): Promise<string[]> {
    return this.enrollmentsService.findMyEnrolledCourseIds(req.user['id']);
  }

  // ─── GET /enrollments/my/activity ────────────────────────────
  @Get('my/activity')
  @ApiOperation({ summary: 'Last 10 completed lessons for the user' })
  @ApiResponse({ status: 200, description: 'Recent activity list' })
  async getMyActivity(@Req() req: Request & { user: { id: string } }) {
    const userId = req.user['id'];
    return this.enrollmentsService.findMyActivity(userId);
  }

  // ─── POST /enrollments ────────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enroll a student in a course' })
  @ApiBody({ type: CreateEnrollmentDto })
  @ApiResponse({
    status: 201,
    description: 'Enrollment created',
    type: ResponseEnrollmentDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Course not available or has no lessons',
  })
  @ApiResponse({
    status: 403,
    description: 'No completed payment found',
  })
  @ApiResponse({
    status: 404,
    description: 'Student profile or course not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Student already enrolled in this course',
  })
  async enroll(
    @Body() dto: CreateEnrollmentDto,
  ): Promise<ResponseEnrollmentDto> {
    return this.enrollmentsService.enroll(dto);
  }

  // ─── PATCH /enrollments/:id/progress ─────────────────────────────────────
  @Patch(':id/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update lesson completion progress' })
  @ApiParam({ name: 'id', description: 'UUID of the enrollment', type: String })
  @ApiResponse({
    status: 200,
    description: 'Progress updated',
    type: ResponseEnrollmentDto,
  })
  @ApiResponse({ status: 400, description: 'Course has no lessons' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async updateProgress(
    @Param('id', ParseUUIDPipe) enrollmentId: string,
  ): Promise<ResponseEnrollmentDto> {
    return this.enrollmentsService.updateProgress(enrollmentId);
  }
}
