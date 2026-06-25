// prettier-ignore
import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BraintreeGateway } from 'braintree';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Payment } from 'src/common/entities/payments.entity';
import { Currency, Status } from 'src/common/entities/enum/payments.enum';
import { CheckoutDto } from './dto/checkout.dto';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { Course } from 'src/common/entities/courses.entity';
import { Status as CourseStatus } from 'src/common/entities/enum/courses.enum';
import { StudentProfile } from 'src/common/entities/student-profile.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { CartItem } from 'src/common/entities/cart-item.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject('BRAINTREE_GATEWAY') private readonly gateway: BraintreeGateway,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(StudentProfile)
    private studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private enrollmentsService: EnrollmentsService,
  ) {}

  async generateClientToken(): Promise<{ clientToken: string }> {
    const response = await this.gateway.clientToken.generate({});
    this.logger.log('Client token generated');
    return { clientToken: response.clientToken };
  }

  async checkout(userId: string, dto: CheckoutDto) {
    const { courseId, nonce, amount } = dto;

    // 1. Verify student profile exists (auto-create if missing — supports INSTRUCTOR/ADMIN purchasing)
    let studentProfile = await this.studentProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!studentProfile) {
      studentProfile = this.studentProfileRepository.create({ userId });
      studentProfile = await this.studentProfileRepository.save(studentProfile);
      this.logger.log(`Auto-created StudentProfile for user ${userId}`);
    }

    // 2. Verify course exists and is published
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException('Course is not available for purchase');
    }

    // 3. Check no duplicate enrollment
    const existing = await this.enrollmentRepository.findOne({
      where: { student: { userId }, course: { id: courseId } },
    });
    if (existing) {
      throw new ConflictException('Already enrolled in this course');
    }

    // 4. Execute Braintree transaction
    let transactionResult: {
      success: boolean;
      transaction?: { id: string };
      message?: string;
    };
    try {
      transactionResult = await this.gateway.transaction.sale({
        amount: amount.toString(),
        paymentMethodNonce: nonce,
        options: { submitForSettlement: true },
      });
    } catch (err: any) {
      this.logger.error(`Braintree SDK error: ${err.message}`);
      await this.savePayment(
        userId,
        courseId,
        amount,
        Currency.EUR,
        Status.FAILED,
        null,
      );
      throw new BadRequestException(`Payment processing error: ${err.message}`);
    }

    if (!transactionResult.success) {
      const btError = transactionResult.message ?? 'Unknown Braintree error';
      this.logger.warn(`Braintree declined: ${btError}`);
      await this.savePayment(
        userId,
        courseId,
        amount,
        Currency.EUR,
        Status.FAILED,
        null,
      );
      if (
        btError.includes('processor declined') ||
        btError.includes('gateway rejected')
      ) {
        throw new BadRequestException(
          'Card was declined. Please try a different payment method.',
        );
      }
      throw new BadRequestException(`Payment failed: ${btError}`);
    }

    // 5. Success — create payment + enrollment
    const transactionId = transactionResult.transaction!.id;
    await this.savePayment(
      userId,
      courseId,
      amount,
      Currency.EUR,
      Status.COMPLETED,
      transactionId,
    );

    await this.enrollmentsService.enroll({ userId, courseId });

    // 6. Remove purchased course from cart (if present)
    await this.cartRepository.delete({
      user: { id: userId },
      course: { id: courseId },
    });
    await Promise.all([
      this.cacheManager.del(`sf:cart:${userId}`),
      this.cacheManager.del(`sf:cart:count:${userId}`),
    ]);

    this.logger.log(
      `Checkout completed: user=${userId}, course=${courseId}, tx=${transactionId}`,
    );

    return {
      success: true,
      transactionId,
      message: 'Payment successful and enrollment created',
    };
  }

  async cartCheckout(
    userId: string,
    items: { courseId: string; price: number }[],
    nonce: string,
  ) {
    const total = items.reduce((sum, i) => sum + i.price, 0);

    let transactionResult: { success: boolean; transaction?: { id: string }; message?: string };
    try {
      transactionResult = await this.gateway.transaction.sale({
        amount: total.toString(),
        paymentMethodNonce: nonce,
        options: { submitForSettlement: true },
      });
    } catch (err: any) {
      this.logger.error(`Braintree SDK error: ${err.message}`);
      for (const item of items) {
        await this.savePayment(userId, item.courseId, item.price, Currency.EUR, Status.FAILED, null);
      }
      throw new BadRequestException(`Payment processing error: ${err.message}`);
    }

    if (!transactionResult.success) {
      const btError = transactionResult.message ?? 'Unknown Braintree error';
      this.logger.warn(`Braintree declined: ${btError}`);
      for (const item of items) {
        await this.savePayment(userId, item.courseId, item.price, Currency.EUR, Status.FAILED, null);
      }
      if (btError.includes('processor declined') || btError.includes('gateway rejected')) {
        throw new BadRequestException('Card was declined. Please try a different payment method.');
      }
      throw new BadRequestException(`Payment failed: ${btError}`);
    }

    const transactionId = transactionResult.transaction!.id;
    for (const item of items) {
      await this.savePayment(userId, item.courseId, item.price, Currency.EUR, Status.COMPLETED, transactionId);
      await this.enrollmentsService.enroll({ userId, courseId: item.courseId });
    }

    this.logger.log(`Cart checkout completed: user=${userId}, items=${items.length}, tx=${transactionId}`);

    return {
      success: true,
      transactionId,
      itemCount: items.length,
    };
  }

  private async savePayment(
    userId: string,
    courseId: string,
    amount: number,
    currency: Currency,
    status: Status,
    transactionId: string | null,
  ) {
    const payment = this.paymentRepository.create({
      user: { id: userId } as any,
      course: { id: courseId } as any,
      amount,
      currency,
      gateway_id: transactionId ?? '',
      status,
    });
    return this.paymentRepository.save(payment);
  }
}
