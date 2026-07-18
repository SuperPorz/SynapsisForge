import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueuesProcessor } from './queues.processor';
import { EmailQueueProcessor } from './email-queue.processor';
import { PushQueueProcessor } from './push-queue.processor';
import { EmailListener } from './email-listener';
import { CertificateListener } from './certificate-listener';
import { CertificateQueueProcessor } from './certificate-queue.processor';
import { MaintenanceQueueProcessor } from './maintenance-queue.processor';
import { ReceiptQueueProcessor } from './receipt-queue.processor';
import { CronJobSetup } from './cron-job-setup';
import { QueuesController } from './queues.controller';
import { MailModule } from '../mail/mail.module';
import { PdfModule } from '../pdf/pdf.module';
import { S3Module } from '../s3/s3.module';
import { Certificate } from '../../common/entities/certificate.entity';
import { Enrollment } from '../../common/entities/enrollments.entity';
import { Payment } from '../../common/entities/payments.entity';
import { UserDevice } from '../../common/entities/user-device.entity';
import { NotificationLog } from '../../common/entities/notification-log.entity';
import { adminAuthMiddleware } from './admin-auth.middleware';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'test',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    BullModule.registerQueue({
      name: 'certificate',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    BullModule.registerQueue({
      name: 'maintenance',
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    BullModule.registerQueue({
      name: 'receipt',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    BullModule.registerQueue({
      name: 'push',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
      middleware: adminAuthMiddleware,
    }),
    BullBoardModule.forFeature({ name: 'test', adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: 'email', adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: 'certificate', adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: 'maintenance', adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: 'receipt', adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: 'push', adapter: BullMQAdapter }),
    MailModule,
    PdfModule,
    S3Module,
    TypeOrmModule.forFeature([
      Certificate,
      Enrollment,
      Payment,
      UserDevice,
      NotificationLog,
    ]),
  ],
  controllers: [QueuesController],
  providers: [
    QueuesProcessor,
    EmailQueueProcessor,
    PushQueueProcessor,
    MaintenanceQueueProcessor,
    EmailListener,
    CertificateListener,
    CertificateQueueProcessor,
    ReceiptQueueProcessor,
    CronJobSetup,
  ],
  exports: [BullModule],
})
export class QueuesModule {}
