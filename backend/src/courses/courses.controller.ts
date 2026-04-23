// prettier-ignore
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly CoursesService: CoursesService) {}

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('category') category?: string,
  ) {
    return this.CoursesService.findAll(page, limit, category);
  }

  @Get('search')
  search(@Query('q') query: string) {
    // q sta per query, è un parametro di ricerca specificato nel service
    return this.CoursesService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.CoursesService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.CoursesService.findBySlug(slug);
  }

  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.CoursesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.CoursesService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.CoursesService.delete(id);
  }
}

/* 
findAll
findOne
findBySlug
create
update
delete
search
*/
