/* eslint-disable */
import { DataSource } from 'typeorm';
import { Enrollment } from '../../common/entities/enrollments.entity';
import { Course } from '../../common/entities/courses.entity';
import { StudentProfile } from '../../common/entities/student-profile.entity';
import { Payment } from '../../common/entities/payments.entity';
import { Status } from '../../common/entities/enum/courses.enum';
import { Certificate } from '../../common/entities/certificate.entity';

// Enums inline — evita dipendenze circolari con le entity
enum Currency { EUR = 'EUR', USD = 'USD', GBP = 'GBP' }
enum PaymentStatus { PENDING = 'PENDING', COMPLETED = 'COMPLETED', FAILED = 'FAILED' }

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickCourses(courses: Course[], count: number): Course[] {
  const shuffled = [...courses].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export interface SeededEnrollment {
  id: string;
  studentUserId: string;
  courseId: string;
  progressPercent: number;
}

export async function seedEnrollments(
  ds: DataSource,
  courses: Course[],
  studentProfiles: StudentProfile[],
): Promise<SeededEnrollment[]> {
  const enrollmentRepo = ds.getRepository(Enrollment);
  const certificateRepo = ds.getRepository(Certificate);
  const paymentRepo = ds.getRepository(Payment);

  const publishedCourses = courses.filter((c) => c.status === Status.PUBLISHED);
  const seededEnrollments: SeededEnrollment[] = [];

  // Only verified students get enrollments (first 8 of 10, last 2 are unverified)
  const enrollableStudents = studentProfiles.slice(0, 8);

  for (let i = 0; i < enrollableStudents.length; i++) {
    const student = enrollableStudents[i];

    // Each student enrolls in 3–5 courses
    const courseCount = randomInt(3, 5);
    const assignedCourses = pickCourses(publishedCourses, courseCount);

    for (let ci = 0; ci < assignedCourses.length; ci++) {
      const course = assignedCourses[ci];

      // Progress distribution:
      // ci === 0 → 100% (ensures at least 1 completed enrollment per student)
      // ci === 1 → 10–60% (in progress)
      // ci >= 2  → 0% (just enrolled)
      let progressPercent: number;
      if (ci === 0) progressPercent = 100;
      else if (ci === 1) progressPercent = randomInt(10, 60);
      else progressPercent = 0;

      const completedAt = progressPercent === 100 ? new Date() : null;

      const enrollment = await enrollmentRepo.save(
        enrollmentRepo.create({
          student,
          course,
          progress_percent: progressPercent,
          completed_at: completedAt ?? undefined,
        }),
      );

      seededEnrollments.push({
        id: enrollment.id,
        studentUserId: student.userId,
        courseId: course.id,
        progressPercent,
      });

      // ── Payment (always for enrolled students) ──────────────────────────
      await paymentRepo.save(
        paymentRepo.create({
          user: { id: student.userId } as any,
          course,
          amount: course.price,
          currency: randomElement([Currency.EUR, Currency.USD, Currency.GBP]) as any,
          gateway_id: `gw_${Date.now()}_${randomInt(1000, 9999)}`,
          status: PaymentStatus.COMPLETED as any,
        }),
      );

      // ── Certificate (only if 100%) ──────────────────────────────────────
      if (progressPercent === 100) {
        await certificateRepo.save(
          certificateRepo.create({
            enrollment,
            pdf_url: `https://synapsis.dev/certificates/${enrollment.id}.pdf`,
            is_valid: true,
          }),
        );
      }

    }

    console.log(
      `  ✅ student[${i}] → ${courseCount} enrollments (1 completed, rest partial/zero)`,
    );
  }

  const completed = seededEnrollments.filter((e) => e.progressPercent === 100).length;
  const partial = seededEnrollments.filter((e) => e.progressPercent > 0 && e.progressPercent < 100).length;
  const zero = seededEnrollments.filter((e) => e.progressPercent === 0).length;

  console.log(
    `  ✅ Total enrollments: ${seededEnrollments.length} (${completed} completed, ${partial} partial, ${zero} at 0%)`,
  );

  return seededEnrollments;
}
