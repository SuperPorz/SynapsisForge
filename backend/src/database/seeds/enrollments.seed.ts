import { DataSource } from 'typeorm';
import { Enrollment } from '../../common/entities/enrollments.entity';
import { Course } from '../../common/entities/courses.entity';
import { StudentProfile } from '../../common/entities/StudentProfile.entity';
import { Status } from '../../common/entities/enum/courses.enum';

export async function seedEnrollments(
  ds: DataSource,
  courses: Course[],
  students: StudentProfile[],
): Promise<void> {
  const repo = ds.getRepository(Enrollment);

  // Iscrivi solo a corsi PUBLISHED
  const published = courses.filter((c) => c.status === Status.PUBLISHED);

  const enrollments: Partial<Enrollment>[] = [];

  students.forEach((student, i) => {
    // ogni student si iscrive a 1-2 corsi
    const course1 = published[i % published.length];
    const course2 = published[(i + 1) % published.length];

    enrollments.push({
      student,
      course: course1,
      progress_percent: Math.floor(Math.random() * 100),
    });
    if (course1.id !== course2.id) {
      enrollments.push({
        student,
        course: course2,
        progress_percent: Math.floor(Math.random() * 100),
      });
    }
  });

  await repo.save(repo.create(enrollments as any));
  console.log(`✅ ${enrollments.length} iscrizioni create`);
}
