import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class CertificateListener {
  constructor(
    @InjectQueue('certificate') private readonly certificateQueue: Queue,
    @InjectQueue('push') private readonly pushQueue: Queue,
  ) {}

  @OnEvent('enrollment.completed')
  async handleEnrollmentCompleted(payload: {
    enrollmentId: string;
    courseId: string;
    courseTitle: string;
    userId: string;
  }): Promise<void> {
    await this.certificateQueue.add('generate-certificate', {
      enrollmentId: payload.enrollmentId,
    });

    await this.pushQueue.add('send-push', {
      userId: payload.userId,
      notification: {
        title: 'Course completed!',
        body: `You earned a certificate for ${payload.courseTitle}`,
        type: 'course_update',
        metadata: {
          courseId: payload.courseId,
          enrollmentId: payload.enrollmentId,
        },
      },
    });
  }
}
