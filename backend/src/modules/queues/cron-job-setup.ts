import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CronJobSetup implements OnModuleInit {
  private readonly logger = new Logger(CronJobSetup.name);

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('maintenance') private readonly maintenanceQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.registerDigestJob();
    await this.registerCleanupJob();
  }

  private async registerDigestJob() {
    const existing = await this.emailQueue.getRepeatableJobs();
    for (const job of existing) {
      if (job.name === 'daily-student-digest') {
        await this.emailQueue.removeRepeatableByKey(job.key);
      }
    }

    await this.emailQueue.add(
      'daily-student-digest',
      {},
      {
        repeat: { pattern: '0 9 * * *' },
        jobId: 'daily-student-digest',
      },
    );

    this.logger.log('Registered daily-student-digest cron (0 9 * * *)');
  }

  private async registerCleanupJob() {
    const existing = await this.maintenanceQueue.getRepeatableJobs();
    for (const job of existing) {
      if (job.name === 'cleanup-expired-tokens') {
        await this.maintenanceQueue.removeRepeatableByKey(job.key);
      }
    }

    await this.maintenanceQueue.add(
      'cleanup-expired-tokens',
      {},
      {
        repeat: { pattern: '0 3 * * 0' },
        jobId: 'cleanup-expired-tokens',
      },
    );

    this.logger.log('Registered cleanup-expired-tokens cron (0 3 * * 0)');
  }
}
