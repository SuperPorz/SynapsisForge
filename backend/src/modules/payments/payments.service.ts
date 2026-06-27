// prettier-ignore
import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { BraintreeGateway } from 'braintree';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHash } from 'node:crypto';
import { plainToInstance } from 'class-transformer';
import { Payment } from 'src/common/entities/payments.entity';
import { Currency, Status } from 'src/common/entities/enum/payments.enum';
import { CheckoutDto } from './dto/checkout.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { PaymentHistoryItem } from './dto/payment-history.dto';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { Course } from 'src/common/entities/courses.entity';
import { Status as CourseStatus } from 'src/common/entities/enum/courses.enum';
import { StudentProfile } from 'src/common/entities/student-profile.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { CartItem } from 'src/common/entities/cart-item.entity';
import { User } from 'src/common/entities/users.entity';
import { SubscriptionPlan } from 'src/common/entities/enum/users.enum';

interface WebhookSubscription {
  id: string;
  transactions?: { id: string; amount: string }[];
}

interface WebhookNotification {
  kind: string;
  subject: {
    subscription?: WebhookSubscription;
  };
}

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
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private enrollmentsService: EnrollmentsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getSubscriptionStatus(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      plan: user.plan,
      subscriptionId: user.subscription_id,
      isPremium: user.plan === SubscriptionPlan.PREMIUM,
    };
  }

  async cancelSubscription(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.plan !== SubscriptionPlan.PREMIUM || !user.subscription_id) {
      throw new BadRequestException('No active premium subscription to cancel');
    }

    try {
      await this.gateway.subscription.cancel(user.subscription_id);
    } catch (err: unknown) {
      this.logger.error(`Braintree cancel error: ${(err as Error).message}`);
    }

    user.plan = SubscriptionPlan.FREE;
    user.subscription_id = null;
    await this.userRepository.save(user);

    this.logger.log(`Subscription cancelled: user=${userId}`);

    return {
      success: true,
      message:
        'Subscription cancelled. You will retain access until the end of the current billing period.',
    };
  }

  async handleWebhook(
    signature: string,
    payload: string,
  ): Promise<{ received: boolean }> {
    let notification: WebhookNotification;
    try {
      notification = await this.gateway.webhookNotification.parse(
        signature,
        payload,
      );
    } catch (err: unknown) {
      this.logger.error(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    const idempotencyKey = createHash('sha256').update(payload).digest('hex');
    const alreadyProcessed = await this.cacheManager.get(
      `sf:webhook:idempotent:${idempotencyKey}`,
    );
    if (alreadyProcessed) {
      this.logger.log(
        `Duplicate webhook skipped (hash=${idempotencyKey.slice(0, 12)}...)`,
      );
      return { received: true };
    }
    await this.cacheManager.set(
      `sf:webhook:idempotent:${idempotencyKey}`,
      true,
      3600,
    );

    const kind = notification.kind;
    const subscription = notification.subject?.subscription;

    this.logger.log(
      `Webhook received: ${kind}, subscription=${subscription?.id}`,
    );

    switch (kind) {
      case 'subscription_charged_successfully':
        if (subscription) await this.handleSubscriptionChargedSuccessfully(subscription);
        break;
      case 'subscription_charged_unsuccessfully':
        if (subscription) await this.handleSubscriptionChargedUnsuccessfully(subscription);
        break;
      case 'subscription_went_past_due':
        if (subscription) await this.handleSubscriptionWentPastDue(subscription);
        break;
      case 'subscription_canceled':
        if (subscription) await this.handleSubscriptionCanceled(subscription);
        break;
      default:
        this.logger.log(`Unhandled webhook kind: ${kind}`);
    }

    return { received: true };
  }

  private async handleSubscriptionChargedSuccessfully(
    subscription: WebhookSubscription,
  ) {
    const subId = subscription.id;
    const user = await this.userRepository.findOne({
      where: { subscription_id: subId },
    });
    if (!user) {
      this.logger.warn(`No user found for subscription ${subId}`);
      return;
    }
    user.plan = SubscriptionPlan.PREMIUM;
    user.subscription_id = subId;
    user.subscription_status = 'active';
    await this.userRepository.save(user);

    const tx = subscription.transactions?.[0];
    const txId = tx?.id ?? subId;
    const amount = tx?.amount ? parseFloat(tx.amount) : 0;
    await this.savePayment(
      user.id,
      null,
      amount,
      Currency.EUR,
      Status.COMPLETED,
      txId,
    );

    this.logger.log(
      `Subscription ${subId} charged successfully — user ${user.id} plan renewed`,
    );
  }

  private async handleSubscriptionChargedUnsuccessfully(
    subscription: WebhookSubscription,
  ) {
    const subId = subscription.id;
    const user = await this.userRepository.findOne({
      where: { subscription_id: subId },
    });
    if (!user) {
      this.logger.warn(`No user found for subscription ${subId}`);
      return;
    }

    const tx = subscription.transactions?.[0];
    const txId = tx?.id ?? subId;
    const amount = tx?.amount ? parseFloat(tx.amount) : 0;
    await this.savePayment(
      user.id,
      null,
      amount,
      Currency.EUR,
      Status.FAILED,
      txId,
    );

    this.logger.warn(
      `Subscription ${subId} charge failed for user ${user.id} (${user.email})`,
    );
    this.eventEmitter.emit('subscription.charge_failed', {
      userId: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
    });
  }

  private async handleSubscriptionWentPastDue(
    subscription: WebhookSubscription,
  ) {
    const subId = subscription.id;
    const user = await this.userRepository.findOne({
      where: { subscription_id: subId },
    });
    if (!user) {
      this.logger.warn(`No user found for subscription ${subId}`);
      return;
    }
    user.subscription_status = 'past_due';
    await this.userRepository.save(user);
    this.logger.log(
      `Subscription ${subId} went past due — user ${user.id} flagged`,
    );
  }

  private async handleSubscriptionCanceled(subscription: WebhookSubscription) {
    const subId = subscription.id;
    const user = await this.userRepository.findOne({
      where: { subscription_id: subId },
    });
    if (!user) {
      this.logger.warn(`No user found for subscription ${subId}`);
      return;
    }
    user.plan = SubscriptionPlan.FREE;
    user.subscription_id = null;
    user.subscription_status = null;
    await this.userRepository.save(user);
    this.logger.log(
      `Subscription ${subId} canceled — user ${user.id} downgraded to FREE`,
    );
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const { nonce, planId } = dto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.plan === SubscriptionPlan.PREMIUM && user.subscription_id) {
      throw new ConflictException(
        'User already has an active premium subscription',
      );
    }

    let customerResult: {
      success: boolean;
      customer?: { id: string };
      message?: string;
    };
    try {
      customerResult = await this.gateway.customer.create({
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email ?? undefined,
      });
    } catch (err: unknown) {
      this.logger.error(
        `Braintree customer creation error: ${(err as Error).message}`,
      );
      throw new BadRequestException(
        `Customer creation error: ${(err as Error).message}`,
      );
    }

    if (!customerResult.success) {
      throw new BadRequestException(
        `Customer creation failed: ${customerResult.message}`,
      );
    }

    const customerId = customerResult.customer!.id;

    let paymentMethodResult: {
      success: boolean;
      paymentMethod?: { token: string };
      message?: string;
    };
    try {
      paymentMethodResult = await this.gateway.paymentMethod.create({
        customerId,
        paymentMethodNonce: nonce,
      });
    } catch (err: unknown) {
      this.logger.error(
        `Braintree payment method error: ${(err as Error).message}`,
      );
      throw new BadRequestException(
        `Payment method creation error: ${(err as Error).message}`,
      );
    }

    if (!paymentMethodResult.success) {
      throw new BadRequestException(
        `Payment method creation failed: ${paymentMethodResult.message}`,
      );
    }

    const paymentToken = paymentMethodResult.paymentMethod!.token;

    let subscriptionResult: {
      success: boolean;
      subscription?: { id: string };
      message?: string;
    };
    try {
      subscriptionResult = await this.gateway.subscription.create({
        paymentMethodToken: paymentToken,
        planId,
      });
    } catch (err: unknown) {
      this.logger.error(
        `Braintree subscription SDK error: ${(err as Error).message}`,
      );
      throw new BadRequestException(
        `Subscription creation error: ${(err as Error).message}`,
      );
    }

    if (!subscriptionResult.success) {
      const btError = subscriptionResult.message ?? 'Unknown Braintree error';
      this.logger.warn(`Braintree subscription declined: ${btError}`);
      throw new BadRequestException(`Subscription failed: ${btError}`);
    }

    const subscription = subscriptionResult.subscription!;
    const subscriptionId = subscription.id;

    user.subscription_id = subscriptionId;
    user.plan = dto.plan ?? SubscriptionPlan.PREMIUM;
    user.subscription_status = 'active';
    await this.userRepository.save(user);

    this.logger.log(
      `Subscription created: user=${userId}, subscription=${subscriptionId}, plan=${user.plan}`,
    );

    return {
      success: true,
      subscriptionId,
      plan: user.plan,
      message: 'Subscription created successfully',
    };
  }

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
    } catch (err: unknown) {
      this.logger.error(`Braintree SDK error: ${(err as Error).message}`);
      await this.savePayment(
        userId,
        courseId,
        amount,
        Currency.EUR,
        Status.FAILED,
        null,
      );
      throw new BadRequestException(
        `Payment processing error: ${(err as Error).message}`,
      );
    }

    if (!transactionResult.success) {
      const btError = transactionResult.message ?? 'Unknown Braintree error';
      const failedTxId = transactionResult.transaction?.id ?? null;
      this.logger.warn(`Braintree declined: ${btError} (tx=${failedTxId})`);
      await this.savePayment(
        userId,
        courseId,
        amount,
        Currency.EUR,
        Status.FAILED,
        failedTxId,
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
    const transaction = transactionResult.transaction!;
    const transactionId = transaction.id;
    const paymentMethod = (transaction as { paymentInstrumentType?: string }).paymentInstrumentType ?? null;
    await this.savePayment(
      userId,
      courseId,
      amount,
      Currency.EUR,
      Status.COMPLETED,
      transactionId,
      paymentMethod,
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

    let transactionResult: {
      success: boolean;
      transaction?: { id: string };
      message?: string;
    };
    try {
      transactionResult = await this.gateway.transaction.sale({
        amount: total.toString(),
        paymentMethodNonce: nonce,
        options: { submitForSettlement: true },
      });
    } catch (err: unknown) {
      this.logger.error(`Braintree SDK error: ${(err as Error).message}`);
      for (const item of items) {
        await this.savePayment(
          userId,
          item.courseId,
          item.price,
          Currency.EUR,
          Status.FAILED,
          null,
        );
      }
      throw new BadRequestException(
        `Payment processing error: ${(err as Error).message}`,
      );
    }

    if (!transactionResult.success) {
      const btError = transactionResult.message ?? 'Unknown Braintree error';
      const failedTxId = transactionResult.transaction?.id ?? null;
      this.logger.warn(`Braintree declined: ${btError} (tx=${failedTxId})`);
      for (const item of items) {
        await this.savePayment(
          userId,
          item.courseId,
          item.price,
          Currency.EUR,
          Status.FAILED,
          failedTxId,
        );
      }
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

    const transaction = transactionResult.transaction!;
    const transactionId = transaction.id;
    const paymentMethod = (transaction as { paymentInstrumentType?: string }).paymentInstrumentType ?? null;
    for (const item of items) {
      await this.savePayment(
        userId,
        item.courseId,
        item.price,
        Currency.EUR,
        Status.COMPLETED,
        transactionId,
        paymentMethod,
      );
      await this.enrollmentsService.enroll({ userId, courseId: item.courseId });
    }

    this.logger.log(
      `Cart checkout completed: user=${userId}, items=${items.length}, tx=${transactionId}`,
    );

    return {
      success: true,
      transactionId,
      itemCount: items.length,
    };
  }

  async getHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: PaymentHistoryItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [rows, total] = await this.paymentRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['course'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: rows.map((r) =>
        plainToInstance(PaymentHistoryItem, r, {
          excludeExtraneousValues: true,
        }),
      ),
      total,
      page,
      limit,
    };
  }

  private async savePayment(
    userId: string,
    courseId: string | null,
    amount: number,
    currency: Currency,
    status: Status,
    transactionId: string | null,
    paymentMethod?: string | null,
  ) {
    const paymentData: DeepPartial<Payment> = {
      user: { id: userId },
      amount,
      currency,
      gateway_id: transactionId ?? '',
      status,
      payment_method: paymentMethod ?? undefined,
      ...(courseId
        ? { course: { id: courseId } as DeepPartial<Payment['course']> }
        : {}),
    };
    const payment = this.paymentRepository.create(paymentData);
    return this.paymentRepository.save(payment);
  }
}
