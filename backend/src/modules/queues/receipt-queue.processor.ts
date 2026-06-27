import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Payment } from '../../common/entities/payments.entity';
import { PdfService } from '../pdf/pdf.service';
import * as path from 'path';

@Processor('receipt')
export class ReceiptQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(ReceiptQueueProcessor.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    private readonly pdfService: PdfService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { paymentId } = job.data as { paymentId: string };
    this.logger.log(`Processing receipt job for payment ${paymentId}`);

    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user', 'course'],
    });

    if (!payment) {
      this.logger.error(`Payment ${paymentId} not found`);
      return;
    }

    const customerName = `${payment.user.first_name} ${payment.user.last_name}`;
    const fileName = `receipt-${payment.id}.pdf`;
    const outputPath = path.join(
      process.cwd(),
      'uploads',
      'receipts',
      fileName,
    );

    await this.pdfService.generateReceipt(
      {
        paymentId: payment.id,
        transactionId: payment.gateway_id,
        amount: parseFloat(payment.amount.toString()),
        currency: payment.currency,
        paymentMethod: payment.payment_method ?? null,
        createdAt: payment.created_at,
        customerName,
        courseTitle: payment.course?.title ?? null,
      },
      outputPath,
    );

    const pdfUrl = `/uploads/receipts/${fileName}`;
    payment.receipt_url = pdfUrl;
    await this.paymentRepository.save(payment);

    this.logger.log(`Receipt ${payment.id} generated → ${pdfUrl}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    const data = job?.data as { paymentId?: string } | undefined;
    this.logger.error(
      `Receipt job ${job?.id} (payment: ${data?.paymentId}) failed: ${error.message}`,
    );
  }
}
