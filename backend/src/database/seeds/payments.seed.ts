/* eslint-disable */
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
    const completedPayment: any = {
      user: { id: user.id },
      amount: 29.99,
      currency: randomElement([Currency.EUR, Currency.USD]),
      gateway_id: `sub_${Date.now()}_${randomInt(1000, 9999)}`,
      status: PaymentStatus.COMPLETED,
      payment_method: randomElement(['credit_card', 'paypal']),
      receipt_url: `uploads/receipts/sub_${Date.now()}_${randomInt(1000, 9999)}.pdf`,
    };
    await paymentRepo.save(paymentRepo.create(completedPayment));

    const failedCourse = publishedCourses[randomInt(0, publishedCourses.length - 1)];
    const failedPayment: any = {
      user: { id: user.id },
      amount: 49.99,
      currency: Currency.EUR,
      gateway_id: `fail_${Date.now()}_${randomInt(1000, 9999)}`,
      status: PaymentStatus.FAILED,
      payment_method: 'credit_card',
    };
    if (failedCourse) failedPayment.course = failedCourse;
    await paymentRepo.save(paymentRepo.create(failedPayment));

    const pendingCourse = publishedCourses.length > 1 ? publishedCourses[randomInt(1, publishedCourses.length - 1)] : publishedCourses[0];
    const pendingPayment: any = {
      user: { id: user.id },
      amount: 19.99,
      currency: Currency.GBP,
      gateway_id: `pending_${Date.now()}_${randomInt(1000, 9999)}`,
      status: PaymentStatus.PENDING,
    };
    if (pendingCourse) pendingPayment.course = pendingCourse;
    await paymentRepo.save(paymentRepo.create(pendingPayment));
  }

  console.log('  ✅ 3 extra payments per verified student (1 completed, 1 failed, 1 pending)');
}
