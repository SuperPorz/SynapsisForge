import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParseUuidPipe } from 'src/common/pipes/parse-uuid.pipe';
import { ParsePositiveIntPipe } from 'src/common/pipes/parse-positive-int.pipe';
import { UserRole } from 'src/common/entities/enum/users.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Courses')
@ApiBadRequestResponse({ description: 'Validation failed or invalid input.' })
@Controller('courses')
export class CoursesController {
  constructor(private readonly CoursesService: CoursesService) {}

  @Public()
  @ApiOperation({ summary: 'Get all courses with pagination and optional category filter' })
  @ApiResponse({ status: 200, description: 'List of courses retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'No courses found for the given criteria.' })
  @Get()
  findAll(
    @Query('page', ParsePositiveIntPipe) page: number = 1,
    @Query('limit', ParsePositiveIntPipe) limit: number = 10,
    @Query('category') category?: string,
  ) {
    return this.CoursesService.findAll(page, limit, category);
  }

  @Public()
  @ApiOperation({ summary: 'Search for courses by title or description' })
  @ApiResponse({ status: 200, description: 'Matching courses found.' })
  @ApiResponse({ status: 404, description: 'No courses found for the given search query.' })
  @Get('search')
  search(@Query('q') query: string) {
    return this.CoursesService.search(query);
  }

  @Public()
  @ApiOperation({ summary: 'Get a course by its ID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @Get(':id')
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.CoursesService.findOne(id);
  }

  @Public()
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
  @ApiResponse({ status: 201, description: 'Course created successfully.' })
  @ApiResponse({ status: 409, description: 'Course already exists.' })
  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.CoursesService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update an existing course' })
  @ApiResponse({ status: 200, description: 'Course updated successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @Patch(':id')
  update(@Param('id', ParseUuidPipe) id: string, @Body() dto: UpdateCourseDto) {
    return this.CoursesService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @Delete(':id')
  delete(@Param('id', ParseUuidPipe) id: string) {
    return this.CoursesService.delete(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Restore a deactivated course' })
  @ApiResponse({ status: 200, description: 'Course restored successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @ApiResponse({ status: 409, description: 'Course is already active.' })
  @Patch(':id/restore')
  restore(@Param('id', ParseUuidPipe) id: string) {
    return this.CoursesService.restore(id);
  }
}
