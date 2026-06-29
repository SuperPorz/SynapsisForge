// prettier-ignore
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all reviews for a course (public)' })
  @ApiParam({
    name: 'courseId',
    description: 'UUID of the course',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'List of reviews retrieved.' })
  findByCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.reviewsService.findByCourse(courseId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a course' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review created successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({ name: 'id', description: 'UUID of the review', type: String })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({ status: 200, description: 'Review updated successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.reviewsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', description: 'UUID of the review', type: String })
  @ApiResponse({ status: 204, description: 'Review deleted successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.reviewsService.remove(id, req.user.sub);
  }
}
