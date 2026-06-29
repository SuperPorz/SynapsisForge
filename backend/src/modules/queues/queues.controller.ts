import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Queues')
@Controller('queues')
export class QueuesController {
  constructor(
    @InjectQueue('test') private readonly testQueue: Queue,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('certificate') private readonly certificateQueue: Queue,
    @InjectQueue('maintenance') private readonly maintenanceQueue: Queue,
    @InjectQueue('receipt') private readonly receiptQueue: Queue,
  ) {}

  @Public()
  @Get('test')
  @ApiOperation({ summary: 'Add a test job to the test queue' })
  @ApiResponse({ status: 200, description: 'Test job added.' })
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
  @ApiBody({ description: 'Recipient email address', required: true, schema: { type: 'object', properties: { to: { type: 'string', example: 'user@example.com' } } } })
  @ApiResponse({ status: 201, description: 'Test email queued.' })
  async sendTestEmail(@Body('to') to: string) {
    const job = await this.emailQueue.add('test-email', { to });
    return { jobId: job.id, message: `Test email queued to ${to}` };
  }

  @Public()
  @Post('certificate/test/:enrollmentId')
  @ApiOperation({ summary: 'Queue a test certificate generation job' })
  @ApiParam({ name: 'enrollmentId', description: 'UUID of the enrollment', type: String })
  @ApiResponse({ status: 201, description: 'Certificate job queued.' })
  async testCertificate(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
  ) {
    const job = await this.certificateQueue.add('generate-certificate', {
      enrollmentId,
    });
    return { jobId: job.id, enrollmentId, message: 'Certificate job queued' };
  }

  @Public()
  @Post('receipt/test/:paymentId')
  @ApiOperation({ summary: 'Queue a test receipt PDF generation job' })
  @ApiParam({ name: 'paymentId', description: 'UUID of the payment', type: String })
  @ApiResponse({ status: 201, description: 'Receipt job queued.' })
  async testReceipt(@Param('paymentId', ParseUUIDPipe) paymentId: string) {
    const job = await this.receiptQueue.add('generate-receipt-pdf', {
      paymentId,
    });
    return { jobId: job.id, paymentId, message: 'Receipt job queued' };
  }

  @Public()
  @Post('maintenance/test')
  @ApiOperation({ summary: 'Trigger maintenance jobs manually' })
  @ApiBody({ description: 'Job name to trigger', required: true, schema: { type: 'object', properties: { jobName: { type: 'string', example: 'cleanup-expired-tokens' } } } })
  @ApiResponse({ status: 201, description: 'Maintenance job queued.' })
  async triggerMaintenance(@Body('jobName') jobName: string) {
    const name = jobName || 'cleanup-expired-tokens';
    const job = await this.maintenanceQueue.add(name, {});
    return { jobId: job.id, jobName: name, message: 'Maintenance job queued' };
  }
}
