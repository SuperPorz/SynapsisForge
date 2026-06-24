import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueuesProcessor } from './queues.processor';
import { EmailQueueProcessor } from './email-queue.processor';
import { EmailListener } from './email-listener';
import { CertificateListener } from './certificate-listener';
import { CertificateQueueProcessor } from './certificate-queue.processor';
import { QueuesController } from './queues.controller';
import { MailModule } from '../mail/mail.module';
import { PdfModule } from '../pdf/pdf.module';
import { Certificate } from '../../common/entities/certificate.entity';
import { Enrollment } from '../../common/entities/enrollments.entity';

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
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
    BullModule.registerQueue({
      name: 'certificate',
    }),
    MailModule,
    PdfModule,
    TypeOrmModule.forFeature([Certificate, Enrollment]),
  ],
  controllers: [QueuesController],
  providers: [
    QueuesProcessor,
    EmailQueueProcessor,
    EmailListener,
    CertificateListener,
    CertificateQueueProcessor,
  ],
  exports: [BullModule],
})
export class QueuesModule {}
