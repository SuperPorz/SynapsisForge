import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { LessonsService } from './lessons.service';
// prettier-ignore
import { ApiBadRequestResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('lessons')
@ApiBadRequestResponse({ description: 'Validation failed or invalid input.' })
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @ApiOperation({ summary: 'Get lesson with content by lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @Get(':id/content')
  async getContent(@Param('id') id: string) {
    const lesson = await this.lessonsService.findLesson(id);
    if (!lesson) throw new NotFoundException(`Lesson ${id} non trovata`);

    const content = await this.lessonsService.findContent(id);

    return {
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      duration_seconds: lesson.duration_seconds,
      course: lesson.course,
      content: content ?? null, // null se il documento MongoDB non esiste ancora
    };
  }
}
