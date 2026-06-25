import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
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
    @InjectQueue('certificate') private readonly certificateQueue: Queue,
    @InjectQueue('maintenance') private readonly maintenanceQueue: Queue,
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
  @Post('email/test')
  @ApiOperation({ summary: 'Send a test email via the email queue' })
  async sendTestEmail(@Body('to') to: string) {
    const job = await this.emailQueue.add('test-email', { to });
    return { jobId: job.id, message: `Test email queued to ${to}` };
  }

  @Public()
  @Post('certificate/test/:enrollmentId')
  @ApiOperation({ summary: 'Queue a test certificate generation job' })
  async testCertificate(@Param('enrollmentId', ParseUUIDPipe) enrollmentId: string) {
    const job = await this.certificateQueue.add('generate-certificate', { enrollmentId });
    return { jobId: job.id, enrollmentId, message: 'Certificate job queued' };
  }

  @Public()
  @Post('maintenance/test')
  @ApiOperation({ summary: 'Trigger maintenance jobs manually' })
  async triggerMaintenance(@Body('jobName') jobName: string) {
    const name = jobName || 'cleanup-expired-tokens';
    const job = await this.maintenanceQueue.add(name, {});
    return { jobId: job.id, jobName: name, message: 'Maintenance job queued' };
  }
}
