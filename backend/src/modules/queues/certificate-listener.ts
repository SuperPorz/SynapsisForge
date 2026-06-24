import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class CertificateListener {
  constructor(
    @InjectQueue('certificate') private readonly certificateQueue: Queue,
  ) {}

  @OnEvent('enrollment.completed')
  async handleEnrollmentCompleted(payload: {
    enrollmentId: string;
  }): Promise<void> {
    await this.certificateQueue.add('generate-certificate', {
      enrollmentId: payload.enrollmentId,
    });
  }
}
