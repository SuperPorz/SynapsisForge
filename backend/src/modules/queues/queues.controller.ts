import { Controller, Get } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('queues')
@Controller('queues')
export class QueuesController {
  constructor(
    @InjectQueue('test') private readonly testQueue: Queue,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  @Public()
  @Get('test')
  @ApiOperation({ summary: 'Add a test job to the test queue' })
  async addTestJob() {
    const job = await this.testQueue.add('test-job', {
      message: 'Hello from BullMQ!',
      timestamp: new Date().toISOString(),
    });
    return { jobId: job.id, message: 'Test job added' };
  }

  @Public()
  @Get('email')
  @ApiOperation({ summary: 'Add a test job to the email queue' })
  async addTestEmailJob() {
    const job = await this.emailQueue.add('test-email', {
      to: 'test@example.com',
      subject: 'Test BullMQ Email',
      template: 'welcome',
    });
    return { jobId: job.id, message: 'Test email job added' };
  }
}
