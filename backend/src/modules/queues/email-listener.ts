import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class EmailListener {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('push') private readonly pushQueue: Queue,
  ) {}

  @OnEvent('user.registered')
  async handleUserRegistered(payload: {
    userId: string;
    email: string;
    name: string;
    verificationToken: string;
  }): Promise<void> {
    await this.emailQueue.add('send-verification-email', {
      to: payload.email,
      name: payload.name,
      token: payload.verificationToken,
    });
  }

  @OnEvent('enrollment.created')
  async handleEnrollmentCreated(payload: {
    enrollmentId: string;
    userId: string;
    email: string;
    userName: string;
    courseId: string;
    courseTitle: string;
  }): Promise<void> {
    await this.emailQueue.add('send-enrollment-confirmation', {
      to: payload.email,
      userName: payload.userName,
      courseTitle: payload.courseTitle,
      courseUrl: `http://localhost:4200/courses/${payload.courseId}`,
    });

    await this.pushQueue.add('send-push', {
      userId: payload.userId,
      notification: {
        title: 'Enrolled!',
        body: `You've enrolled in ${payload.courseTitle}`,
        type: 'course_update',
        metadata: {
          courseId: payload.courseId,
          enrollmentId: payload.enrollmentId,
        },
      },
    });
  }

  @OnEvent('subscription.charge_failed')
  async handleSubscriptionChargeFailed(payload: {
    userId: string;
    email: string | null;
    name: string;
  }): Promise<void> {
    await this.emailQueue.add('send-subscription-failed', {
      to: payload.email,
      name: payload.name,
    });

    await this.pushQueue.add('send-push', {
      userId: payload.userId,
      notification: {
        title: 'Payment failed',
        body: 'Your subscription payment failed. Please update your payment method.',
        type: 'course_update',
        metadata: {},
      },
    });
  }
}
