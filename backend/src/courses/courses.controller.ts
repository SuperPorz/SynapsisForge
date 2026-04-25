import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ApiBadRequestResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('courses')
@ApiBadRequestResponse({ description: 'Validation failed or invalid input.' })
@Controller('courses')
export class CoursesController {
  constructor(private readonly CoursesService: CoursesService) {}

  @ApiOperation({ summary: 'Get all courses with pagination and optional category filter' })
  @ApiResponse({ status: 200, description: 'List of courses retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'No courses found for the given criteria.' })
  @Get()
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('category') category?: string,
  ) {
    return this.CoursesService.findAll(page, limit, category);
  }

  @ApiOperation({ summary: 'Search for courses by title or description' })
  @ApiResponse({ status: 200, description: 'Matching courses found.' })
  @ApiResponse({ status: 404, description: 'No courses found for the given search query.' })
  @Get('search')
  search(@Query('q') query: string) {
    return this.CoursesService.search(query);
  }

  @ApiOperation({ summary: 'Get a course by its ID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.CoursesService.findOne(id);
  }

  @ApiOperation({ summary: 'Find a course by its slug' })
  @ApiResponse({ status: 200, description: 'Course found by slug.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.CoursesService.findBySlug(slug);
  }

  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully.' })
  @ApiResponse({ status: 409, description: 'Course already exists.' })
  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.CoursesService.create(dto);
  }

  @ApiOperation({ summary: 'Update an existing course' })
  @ApiResponse({ status: 200, description: 'Course updated successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.CoursesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.CoursesService.delete(id);
  }

  @ApiOperation({ summary: 'Restore a deactivated course' })
  @ApiResponse({ status: 200, description: 'Course restored successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @ApiResponse({ status: 409, description: 'Course is already active.' })
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.CoursesService.restore(id);
  }
}