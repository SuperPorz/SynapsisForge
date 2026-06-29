import { DataSource } from 'typeorm';
import { Course } from '../../common/entities/courses.entity';
import { Status } from '../../common/entities/enum/courses.enum';
import { Enrollment } from '../../common/entities/enrollments.entity';
import { Review } from '../../common/entities/reviews.entity';
import { StudentProfile } from '../../common/entities/student-profile.entity';
import type { SeededEnrollment } from './enrollments.seed';

const REVIEW_COMMENTS: (string | null)[] = [
  'Excellent course, very well structured. The instructor explains complex topics clearly and provides great real-world examples.',
  'One of the best courses I have taken. Practical examples and real-world projects made everything click. Highly recommend to anyone looking to level up.',
  'Great content. Some sections could go deeper, but overall highly recommended for beginners and intermediate learners alike.',
  'The hands-on approach made everything click. Worth every penny. I went from knowing nothing to building my own projects confidently.',
  'Clear explanations and well-paced. I went from zero to confident in this topic in just a few weeks. The exercises are fantastic.',
  'Good course overall. The instructor knows their stuff. A few sections felt rushed but the accompanying code examples helped fill the gaps.',
  'Solid introduction to the topic. Could use more advanced content towards the end, but as a foundation course it delivers exactly what it promises.',
  'Perfect for beginners. The step-by-step approach is exactly what I needed. Every concept is explained with practical examples.',
  'Outstanding! The project-based approach really helps cement the concepts. I have already recommended this to my colleagues.',
  'Decent course with good production quality. The quizzes at the end of each section helped reinforce the material effectively.',
  'This course exceeded my expectations. The instructor clearly put a lot of thought into the curriculum design and it shows.',
  'Well-organized and easy to follow. I appreciated the focus on best practices and industry standards throughout.',
  'Very practical course. I was able to apply what I learned immediately to my day job. The real-world scenarios were invaluable.',
  'A bit too basic in parts, but the advanced sections made up for it. Good value for the price overall.',
  null,
  null,
  null,
];

const RATINGS_POOL = [3, 4, 4, 4, 5, 5];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function seedRatings(
  ds: DataSource,
  seededEnrollments: SeededEnrollment[],
): Promise<void> {
  const courseRepo = ds.getRepository(Course);
  const enrollmentRepo = ds.getRepository(Enrollment);
  const studentRepo = ds.getRepository(StudentProfile);
  const reviewRepo = ds.getRepository(Review);

  const publishedCourses = await courseRepo.find({
    where: { status: Status.PUBLISHED },
  });

  const enrollmentIds = new Set(seededEnrollments.map((e) => e.id));
  let totalReviews = 0;
  let coursesWithReviews = 0;

  for (const course of publishedCourses) {
    // Find seeded enrollments for this course
    const allEnrollments = await enrollmentRepo.find({
      where: { course: { id: course.id } },
      relations: ['student', 'student.user'],
    });

    const seededForCourse = allEnrollments.filter((e) =>
      enrollmentIds.has(e.id),
    );

    // Target 2-4 reviews per course
    const targetCount = randomInt(2, 4);
    const selectedEnrollments: Enrollment[] = [];

    // 1. Use existing enrollments first
    if (seededForCourse.length > 0) {
      selectedEnrollments.push(
        ...shuffle(seededForCourse).slice(0, targetCount),
      );
    }

    // 2. If we still need more reviews, pick random students to create fake enrollments
    if (selectedEnrollments.length < targetCount) {
      const students = await studentRepo.find({ relations: ['user'] });
      const usedStudentIds = new Set(
        selectedEnrollments.map((e) => e.student.userId),
      );
      const availableStudents = students.filter(
        (s) => !usedStudentIds.has(s.userId),
      );

      const extra = shuffle(availableStudents).slice(
        0,
        targetCount - selectedEnrollments.length,
      );

      for (const student of extra) {
        // Create a fake enrollment (just for the review) with completed status
        const fakeEnrollment = await enrollmentRepo.save(
          enrollmentRepo.create({
            student,
            course,
            progress_percent: 100,
            completed_at: new Date(),
          }),
        );
        selectedEnrollments.push(fakeEnrollment);
      }
    }

    // Create reviews
    for (const enrollment of selectedEnrollments) {
      const rating = randomElement(RATINGS_POOL);
      const comment = randomElement(REVIEW_COMMENTS);

      await reviewRepo.save(
        reviewRepo.create({
          enrollment: { id: enrollment.id },
          rating,
          comment: comment ?? undefined,
        }),
      );
      totalReviews++;
    }

    if (selectedEnrollments.length > 0) coursesWithReviews++;
  }

  console.log(
    `  ✅ ${totalReviews} reviews created across ${coursesWithReviews} published courses`,
  );
}
