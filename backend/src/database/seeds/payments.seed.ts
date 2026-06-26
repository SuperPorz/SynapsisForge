import { DataSource } from 'typeorm';
import { User } from '../../common/entities/users.entity';
import { Course } from '../../common/entities/courses.entity';
import { StudentProfile } from '../../common/entities/student-profile.entity';
import { Payment } from '../../common/entities/payments.entity';

enum Currency { EUR = 'EUR', USD = 'USD', GBP = 'GBP' }
enum PaymentStatus { PENDING = 'PENDING', COMPLETED = 'COMPLETED', FAILED = 'FAILED' }

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedPayments(
  ds: DataSource,
  courses: Course[],
  studentProfiles: StudentProfile[],
): Promise<void> {
  const paymentRepo = ds.getRepository(Payment);
  const userRepo = ds.getRepository(User);

  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED');
  const verifiedStudents = studentProfiles.slice(0, 8);

  for (const student of verifiedStudents) {
    const user = await userRepo.findOne({ where: { id: student.userId } });
    if (!user) continue;

    // 1 completed course payment (already created by enrollments seed, skip)

    // 2 subscription payments (no course)
    await paymentRepo.save(
      paymentRepo.create({
        user,
        course: null,
        amount: 29.99,
        currency: randomElement([Currency.EUR, Currency.USD]),
        gateway_id: `sub_${Date.now()}_${randomInt(1000, 9999)}`,
        status: PaymentStatus.COMPLETED,
        payment_method: randomElement(['credit_card', 'paypal']),
        receipt_url: `uploads/receipts/sub_${Date.now()}_${randomInt(1000, 9999)}.pdf`,
      }),
    );

    // 1 failed payment
    await paymentRepo.save(
      paymentRepo.create({
        user,
        course: publishedCourses.length > 0 ? publishedCourses[randomInt(0, publishedCourses.length - 1)] : null,
        amount: 49.99,
        currency: Currency.EUR,
        gateway_id: `fail_${Date.now()}_${randomInt(1000, 9999)}`,
        status: PaymentStatus.FAILED,
        payment_method: 'credit_card',
      }),
    );

    // 1 pending payment
    await paymentRepo.save(
      paymentRepo.create({
        user,
        course: publishedCourses.length > 1 ? publishedCourses[randomInt(1, publishedCourses.length - 1)] : null,
        amount: 19.99,
        currency: Currency.GBP,
        gateway_id: `pending_${Date.now()}_${randomInt(1000, 9999)}`,
        status: PaymentStatus.PENDING,
        payment_method: null,
      }),
    );
  }

  console.log('  ✅ 3 extra payments per verified student (1 completed, 1 failed, 1 pending)');
}
