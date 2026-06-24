import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueuesProcessor } from './queues.processor';
import { EmailQueueProcessor } from './email-queue.processor';
import { EmailListener } from './email-listener';
import { QueuesController } from './queues.controller';
import { MailModule } from '../mail/mail.module';

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
    MailModule,
  ],
  controllers: [QueuesController],
  providers: [QueuesProcessor, EmailQueueProcessor, EmailListener],
  exports: [BullModule],
})
export class QueuesModule {}
