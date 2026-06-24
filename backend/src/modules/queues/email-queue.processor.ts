import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../mail/mail.service';
import { Logger } from '@nestjs/common';

@Processor('email', { concurrency: 3 })
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly mailService: MailService) {
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
      default:
        this.logger.warn(`Unknown email job type: ${job.name}`);
    }

    this.logger.log(`Email job ${job.id} completed`);
  }
}
