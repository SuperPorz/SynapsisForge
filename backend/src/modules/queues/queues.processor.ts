import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('test')
export class QueuesProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    console.log(`[BullMQ] Test job processed — ID: ${job.id}`, job.data);
  }
}
