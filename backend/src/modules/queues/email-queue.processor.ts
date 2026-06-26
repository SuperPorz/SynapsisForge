import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  MailService,
  SendDailyDigestInput,
  SendSubscriptionFailedInput,
} from '../mail/mail.service';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../../common/entities/enrollments.entity';

@Processor('email', { concurrency: 3 })
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(
    private readonly mailService: MailService,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing email job: ${job.id} (${job.name})`);

    switch (job.name) {
      case 'send-welcome-email':
        await this.mailService.sendWelcomeEmail(job.data);
        break;
      case 'send-enrollment-confirmation':
        await this.mailService.sendEnrollmentConfirmation(job.data);
        break;
      case 'test-email':
        await this.mailService.sendTestEmail(job.data.to);
        break;
      case 'send-subscription-failed':
        await this.mailService.sendSubscriptionFailed(job.data);
        break;
      case 'daily-student-digest':
        await this.handleDailyDigest();
        break;
      default:
        this.logger.warn(`Unknown email job type: ${job.name}`);
    }

    this.logger.log(`Email job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error) {
    this.logger.error(
      `Email job ${job?.id} (${job?.name}) failed after ${job?.attemptsMade} attempts: ${error.message}`,
    );
  }

  private async handleDailyDigest() {
    this.logger.log('Generating daily student digest…');

    const enrollments = await this.enrollmentRepository.find({
      where: { progress_percent: 100 },
      relations: { student: { user: true }, course: true },
    });

    const completed = enrollments.length;

    const active = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoinAndSelect('enrollment.student', 'student')
      .innerJoinAndSelect('student.user', 'user')
      .innerJoinAndSelect('enrollment.course', 'course')
      .where('enrollment.progress_percent < 100')
      .getMany();

    this.logger.log(
      `Digest: ${active.length} active enrollments, ${completed} completed today`,
    );

    for (const enrollment of active) {
      const name = `${enrollment.student.user.first_name} ${enrollment.student.user.last_name}`;
      const input: SendDailyDigestInput = {
        to: enrollment.student.user.email || '',
        name,
        courseTitle: enrollment.course.title,
        progress: enrollment.progress_percent,
      };
      try {
        await this.mailService.sendDailyDigest(input);
      } catch (err) {
        this.logger.error(
          `Failed to send digest to ${input.to}`,
          (err as Error).message,
        );
      }
    }

    this.logger.log(`Daily digest sent to ${active.length} students`);
  }
}
