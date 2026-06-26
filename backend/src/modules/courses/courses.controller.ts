import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseUuidPipe } from 'src/common/pipes/parse-uuid.pipe';
import { ParsePositiveIntPipe } from 'src/common/pipes/parse-positive-int.pipe';
import { UserRole } from 'src/common/entities/enum/users.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { CourseResponseDto } from './dto/response-course.dto';
import { plainToInstance } from 'class-transformer';
import { SearchFilterDto } from './dto/search-filter.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';

@ApiTags('Courses')
@ApiBadRequestResponse({ description: 'Validation failed or invalid input.' })
@Controller('courses')
export class CoursesController {
  constructor(private readonly CoursesService: CoursesService) {}

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get all courses with pagination and optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of courses retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'No courses found for the given criteria.',
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  async findAll(
    @Query('page', ParsePositiveIntPipe) page: number = 1,
    @Query('limit', ParsePositiveIntPipe) limit: number = 10,
    @Query('category') category?: string,
    @Query('featured', new ParseBoolPipe({ optional: true }))
    featured?: boolean,
    @Query('q') q?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    const { data, total } = await this.CoursesService.findAll(
      page,
      limit,
      category,
      featured,
      q,
      minPrice ? Number(minPrice) : undefined,
      maxPrice ? Number(maxPrice) : undefined,
    );

    return {
      data: plainToInstance(CourseResponseDto, data, {
        excludeExtraneousValues: true,
      }),
      total,
    };
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get all available course categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully.',
  })
  @Get('categories')
  getCategories() {
    return this.CoursesService.getCategories();
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Search for courses by title or description' })
  @ApiResponse({ status: 200, description: 'Matching courses found.' })
  @ApiResponse({
    status: 404,
    description: 'No courses found for the given search query.',
  })
  @Get('search')
  search(@Query('q') query: string) {
    return this.CoursesService.search(query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({
    summary: 'Get all courses owned by the authenticated instructor',
  })
  @ApiResponse({ status: 200, description: 'Instructor courses retrieved.' })
  @Get('my')
  findMyCourses(@Req() req: Request & { user: { id: string } }) {
    return this.CoursesService.findMyCourses(req.user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({
    summary: 'Get stats for a course (enrollments, rating, watch time)',
  })
  @ApiResponse({ status: 200, description: 'Course stats retrieved.' })
  @Get('my/stats/:id')
  getCourseStats(
    @Req() req: Request & { user: { id: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.CoursesService.getCourseStats(req.user.id, id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({
    summary: 'Get lesson list with watch time stats for a course',
  })
  @ApiResponse({ status: 200, description: 'Lessons with stats retrieved.' })
  @Get('my/:id/lessons')
  getCourseLessons(
    @Req() req: Request & { user: { id: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.CoursesService.getCourseLessonsWithStats(req.user.id, id);
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get a course by its ID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @Get(':id')
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.CoursesService.findOne(id);
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Find a course by its slug' })
  @ApiResponse({ status: 200, description: 'Course found by slug.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.CoursesService.findBySlug(slug);
  }

  // CREAZIONE/MODIFICA/CANCELLAZIONE CORSO

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiCreatedResponse({ description: 'Course created successfully.' })
  @ApiResponse({ status: 409, description: 'Course already exists.' })
  @Post()
  create(
    @Body() dto: CreateCourseDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.CoursesService.create(dto, req.user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update an existing course' })
  @ApiResponse({ status: 200, description: 'Course updated successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @Patch(':id')
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateCourseDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.CoursesService.update(id, dto, req.user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @Delete(':id')
  delete(
    @Param('id', ParseUuidPipe) id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.CoursesService.delete(id, req.user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Restore a deactivated course' })
  @ApiResponse({ status: 200, description: 'Course restored successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @ApiResponse({ status: 409, description: 'Course is already active.' })
  @Patch(':id/restore')
  restore(
    @Param('id', ParseUuidPipe) id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.CoursesService.restore(id, req.user.id);
  }

  // ---------------------------------------------------------------------------
  // Section CRUD
  // ---------------------------------------------------------------------------

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a section in a course' })
  @ApiCreatedResponse({ description: 'Section created successfully.' })
  @Post(':courseId/sections')
  createSection(
    @Param('courseId', ParseUuidPipe) courseId: string,
    @Body() dto: CreateSectionDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.CoursesService.createSection(courseId, dto, req.user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update a section' })
  @ApiResponse({ status: 200, description: 'Section updated successfully.' })
  @Patch(':courseId/sections/:sectionId')
  updateSection(
    @Param('courseId', ParseUuidPipe) courseId: string,
    @Param('sectionId', ParseUuidPipe) sectionId: string,
    @Body() dto: UpdateSectionDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.CoursesService.updateSection(
      courseId,
      sectionId,
      dto,
      req.user.id,
    );
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete a section' })
  @ApiNoContentResponse({ description: 'Section deleted successfully.' })
  @Delete(':courseId/sections/:sectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSection(
    @Param('courseId', ParseUuidPipe) courseId: string,
    @Param('sectionId', ParseUuidPipe) sectionId: string,
    @Req() req: Request & { user: { id: string } },
  ): Promise<void> {
    return this.CoursesService.deleteSection(courseId, sectionId, req.user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Reorder sections' })
  @ApiResponse({ status: 200, description: 'Sections reordered successfully.' })
  @Patch(':courseId/sections/reorder')
  reorderSections(
    @Param('courseId', ParseUuidPipe) courseId: string,
    @Body() dto: ReorderSectionsDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.CoursesService.reorderSections(courseId, dto, req.user.id);
  }

  @ApiOperation({ summary: 'Search for courses with filters' })
  @ApiResponse({ status: 200, description: 'Filtered courses found.' })
  @ApiResponse({
    status: 404,
    description: 'No courses found for the given filters.',
  })
  @Get('search/filter')
  searchFilter(@Query() filters: SearchFilterDto) {
    return this.CoursesService.searchFilter(filters);
  }
}
