/* eslint-disable */
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Enrollment } from '../../common/entities/enrollments.entity';
import { Course } from '../../common/entities/courses.entity';
import { StudentProfile } from '../../common/entities/student-profile.entity';
import { Payment } from '../../common/entities/payments.entity';
import { Status } from '../../common/entities/enum/courses.enum';
import { Certificate } from '../../common/entities/certificate.entity';
import { PdfService } from '../../modules/pdf/pdf.service';

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
  const pdfService = new PdfService();
  const useS3 = process.env.USE_S3 === 'true';

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

      // ── Real Certificate (only if 100%) ─────────────────────────────────
      if (progressPercent === 100) {
        // Reload enrollment with relations for student name
        const full = await enrollmentRepo.findOne({
          where: { id: enrollment.id },
          relations: ['student', 'student.user', 'course'],
        });

        if (full) {
          const cert = certificateRepo.create({ enrollment, pdf_url: '' });
          const saved = await certificateRepo.save(cert);

          const pdfBuffer = await pdfService.generateCertificate({
            studentName: `${full.student.user.first_name} ${full.student.user.last_name}`,
            courseTitle: full.course.title,
            issuedAt: saved.issued_at,
            certificateCode: saved.certificate_code,
          });

          if (useS3) {
            const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
            const s3Client = new S3Client({
              region: process.env.AWS_REGION || 'eu-south-1',
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
              },
            });
            const s3Key = `certificates/${saved.id}.pdf`;
            const privateBucket = process.env.S3_PRIVATE_BUCKET || 'synapsisforge-private';
            await s3Client.send(new PutObjectCommand({
              Bucket: privateBucket,
              Key: s3Key,
              Body: pdfBuffer,
              ContentType: 'application/pdf',
            }));
            saved.s3_key = s3Key;
          } else {
            const fileName = `certificate-${saved.id}.pdf`;
            const outputDir = path.join(process.cwd(), 'uploads', 'certificates');
            fs.mkdirSync(outputDir, { recursive: true });
            fs.writeFileSync(path.join(outputDir, fileName), pdfBuffer);
            saved.pdf_url = `/uploads/certificates/${fileName}`;
          }

          await certificateRepo.save(saved);
        }
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
