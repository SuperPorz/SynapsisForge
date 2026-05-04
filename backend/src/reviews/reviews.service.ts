// prettier-ignore
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { Review } from 'src/common/entities/reviews.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { isDbError } from 'src/common/utils/is-db-error';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepo: Repository<Review>,

    @InjectRepository(Enrollment)
    private readonly enrollmentsRepo: Repository<Enrollment>,
  ) {}

  async create(dto: CreateReviewDto): Promise<Review> {
    // Controllo che l'enrollment esista, appartenga allo studente e sia completato
    const enrollment = await this.enrollmentsRepo.findOne({
      where: { id: dto.enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found for this student');
    }

    if (enrollment.completed_at === null) {
      throw new ForbiddenException('Course not yet completed');
    }

    // Controllo che non ci sia già una recensione per questa enrollment prima di salvarla
    const existing = await this.reviewsRepo.findOne({
      where: { enrollment: { id: enrollment.id } },
    });

    if (existing) {
      throw new ConflictException(
        'A review already exists for this enrollment',
      );
    }

    const review = this.reviewsRepo.create({
      rating: dto.rating,
      comment: dto.comment ?? null,
      enrollment,
    });

    // Intercetta la violazione DB come safety net (race condition)
    // uso type guard custom per identificare l'errore di violazione di unicità (23505)
    try {
      return await this.reviewsRepo.save(review);
    } catch (err) {
      if (isDbError(err, '23505')) {
        throw new ConflictException(
          'A review already exists for this enrollment',
        );
      }
      throw err;
    }
  }

  // I controlli di esistenza e ownership della review saranno delegati al JWT guard

  async update(
    reviewId: string,
    dto: UpdateReviewDto,
    currentUserId: string,
  ): Promise<Review> {
    const review = await this.reviewsRepo.findOne({
      where: { id: reviewId },
      relations: { enrollment: { student: true } },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.enrollment.student.userId !== currentUserId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    Object.assign(review, dto);
    return await this.reviewsRepo.save(review);
  }

  async remove(reviewId: string, currentUserId: string): Promise<string> {
    const review = await this.reviewsRepo.findOne({
      where: { id: reviewId },
      relations: { enrollment: { student: true } },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.enrollment.student.userId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewsRepo.remove(review);
    return `Review id ${reviewId} deleted successfully`;
  }
}
