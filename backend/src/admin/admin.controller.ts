import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { CourseActionsDto } from './dto/course-actions.dto';

@Controller('admin')
// TODO: @UseGuards(JwtAuthGuard, RolesGuard) – implementare quando disponibile auth module
// TODO: @Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── GET /admin/users ────────────────────────────────────────────────
  @Get('users')
  filtered_users(@Query() filters: FilterUsersDto) {
    return this.adminService.find_users(filters);
  }

  // ─── PATCH /admin/courses/:id/approve ────────────────────────────────────────────────
  @Patch('courses/:id/approve') // bisogna usare @Param perchè l'id è nel path non nei query-params
  approve_course(@Param() filters: CourseActionsDto) {
    return this.adminService.approve(filters);
  }

  // ─── PATCH /admin/courses/:id/reject ────────────────────────────────────────────────
  @Patch('courses/:id/reject')
  reject_course(@Param() filters: CourseActionsDto) {
    return this.adminService.reject(filters);
  }

  @Get('stats')
  get_stats() {
    return this.adminService.stats();
  }
}
