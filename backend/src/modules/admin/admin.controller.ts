import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { CourseActionsDto } from './dto/course-actions.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/entities/enum/users.enum';

@ApiBearerAuth()
@ApiTags('Admin')
@ApiUnauthorizedResponse({
  description: 'Unauthorized - missing or invalid JWT.',
})
@ApiForbiddenResponse({
  description: 'Forbidden - insufficient admin permissions.',
})
@Roles(UserRole.ADMIN) // ← protegge tutti gli endpoint del controller
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── GET /admin/users ────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Get filtered users',
    description:
      'Returns a list of users filterable by role (UserRole) and active status.',
  })
  @ApiOkResponse({ description: 'Users retrieved successfully.' })
  @ApiBadRequestResponse({
    description:
      'Invalid filter parameters (e.g. non-existent role or invalid boolean format).',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'],
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @Get('users')
  filtered_users(@Query() filters: FilterUsersDto) {
    // Gestisce i filtri role (enum) e is_active (boolean trasformato)
    return this.adminService.find_users(filters);
  }

  // ─── GET /admin/courses/pending ──────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Get pending courses for moderation',
    description: 'Returns all courses with PENDING status.',
  })
  @ApiOkResponse({ description: 'Pending courses retrieved successfully.' })
  @Get('courses/pending')
  pending_courses() {
    return this.adminService.findPendingCourses();
  }

  // ─── PATCH /admin/courses/:id/approve ────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Approve a course',
    description:
      'Sets the status of a course to "approved". Requires a valid UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the course to approve',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Course approved successfully.' })
  @ApiNotFoundResponse({ description: 'Course not found.' })
  @ApiBadRequestResponse({ description: 'Provided ID is not a valid UUID.' })
  @Patch('courses/:id/approve')
  approve_course(@Param() filters: CourseActionsDto) {
    // Utilizza CourseActionsDto per validare l'ID come UUID
    return this.adminService.approve(filters);
  }

  // ─── PATCH /admin/courses/:id/reject ────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Reject a course',
    description: 'Sets the status of a course to "rejected".',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the course to reject',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Course rejected successfully.' })
  @ApiNotFoundResponse({ description: 'Course not found.' })
  @ApiBadRequestResponse({ description: 'Provided ID is not a valid UUID.' })
  @Patch('courses/:id/reject')
  reject_course(@Param() filters: CourseActionsDto) {
    // L'ID viene estratto e validato tramite CourseActionsDto
    return this.adminService.reject(filters);
  }

  // ─── GET /admin/stats ────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Global platform statistics',
    description: 'Returns platform statistics (users, courses, sales).',
  })
  @ApiOkResponse({ description: 'Statistics generated successfully.' })
  @Get('stats')
  get_stats() {
    return this.adminService.stats();
  }

  // ─── GET /admin/cache-stats ──────────────────────────────────────────
  @ApiOperation({
    summary: 'Redis cache statistics',
    description:
      'Returns Redis cache metrics (hit rate, memory, keys by prefix, eviction policy).',
  })
  @ApiOkResponse({ description: 'Cache metrics retrieved successfully.' })
  @Get('cache-stats')
  get_cache_stats() {
    return this.adminService.getCacheStats();
  }
}
