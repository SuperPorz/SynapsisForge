import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('test')
export class QueuesProcessor extends WorkerHost {
  private readonly logger = new Logger(QueuesProcessor.name);

  async process(job: Job): Promise<void> {
    this.logger.log(`Test job processed — ID: ${job.id}`, job.data);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error) {
    this.logger.error(`Test job ${job?.id} failed: ${error.message}`);
  }
}
