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
  UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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

@ApiTags('Courses')
@ApiBadRequestResponse({ description: 'Validation failed or invalid input.' })
@Controller('courses')
export class CoursesController {
  constructor(private readonly CoursesService: CoursesService) {}

  @Public()
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
