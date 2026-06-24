import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class EmailListener {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  @OnEvent('user.registered')
  async handleUserRegistered(payload: {
    userId: string;
    email: string;
    name: string;
  }): Promise<void> {
    await this.emailQueue.add('send-welcome-email', {
      to: payload.email,
      name: payload.name,
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
  }
}
