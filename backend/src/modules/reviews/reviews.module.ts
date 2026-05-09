import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from 'src/common/entities/reviews.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Enrollment } from 'src/common/entities/enrollments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Enrollment])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
