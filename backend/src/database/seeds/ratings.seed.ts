/* eslint-disable */
import { DataSource } from 'typeorm';
import { Enrollment } from '../../common/entities/enrollments.entity';
import { Review } from '../../common/entities/reviews.entity';
import type { SeededEnrollment } from './enrollments.seed';

const REVIEW_COMMENTS = [
  'Excellent course, very well structured. The instructor explains complex topics clearly.',
  'One of the best courses I have taken. Practical examples and real-world projects.',
  'Great content. Some sections could go deeper, but overall highly recommended.',
  'The hands-on approach made everything click. Worth every penny.',
  'Clear explanations and well-paced. I went from zero to confident in this topic.',
  null,
  null,
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedRatings(
  ds: DataSource,
  seededEnrollments: SeededEnrollment[],
): Promise<void> {
  const enrollmentRepo = ds.getRepository(Enrollment);
  const reviewRepo = ds.getRepository(Review);

  let total = 0;

  for (const se of seededEnrollments) {
    if (se.progressPercent < 100) continue;

    const enrollment = await enrollmentRepo.findOne({
      where: { id: se.id },
    });
    if (!enrollment) continue;

    const rating = randomElement([3, 4, 4, 5]);
    const comment = randomElement(REVIEW_COMMENTS);

    await reviewRepo.save(
      reviewRepo.create({
        enrollment,
        rating,
        comment: comment ?? undefined,
      }),
    );
    total++;
  }

  console.log(`  ✅ ${total} ratings created for completed enrollments`);
}
