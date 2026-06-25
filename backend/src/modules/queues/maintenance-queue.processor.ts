import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { createClient } from '@redis/client';

@Processor('maintenance')
export class MaintenanceQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(MaintenanceQueueProcessor.name);

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing maintenance job: ${job.id} (${job.name})`);

    switch (job.name) {
      case 'cleanup-expired-tokens':
        await this.handleCleanupExpiredTokens();
        break;
      default:
        this.logger.warn(`Unknown maintenance job type: ${job.name}`);
    }

    this.logger.log(`Maintenance job ${job.id} completed`);
  }

  private async handleCleanupExpiredTokens() {
    this.logger.log('Starting weekly cleanup of expired tokens…');

    try {
      const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
      await client.connect();

      const pattern = 'sf:session:*';
      let cursor = '0';
      let totalRemoved = 0;

      do {
        const result = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = result.cursor;
        for (const key of result.keys) {
          const ttl = await client.ttl(key);
          if (ttl <= 0) {
            await client.del(key);
            totalRemoved++;
          }
        }
      } while (cursor !== '0');

      await client.quit();
      this.logger.log(`Cleanup complete: ${totalRemoved} stale keys removed`);
    } catch (error) {
      this.logger.error('Cleanup failed', (error as Error).message);
    }
  }
}
