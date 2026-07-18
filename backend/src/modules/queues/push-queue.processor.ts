import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import type { ServiceAccount } from 'firebase-admin/app';
import type { MulticastMessage, BatchResponse } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';
import { UserDevice } from '../../common/entities/user-device.entity';
import { NotificationLog } from '../../common/entities/notification-log.entity';
import { NotificationType } from '../../common/entities/enum/notifications.enum';

function loadFirebaseCredentials(): ServiceAccount | undefined {
  const fromEnv = process.env.FCM_CREDENTIALS;
  if (fromEnv) {
    return JSON.parse(fromEnv) as ServiceAccount;
  }

  const filePath = path.resolve(process.cwd(), 'firebase-credentials.json');
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as ServiceAccount;
  }

  return undefined;
}

if (!getApps().length) {
  const serviceAccount = loadFirebaseCredentials();
  if (serviceAccount) {
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    initializeApp();
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
}

export interface PushJobData {
  userId: string;
  notification: PushNotificationPayload;
}

@Processor('push', { concurrency: 5 })
export class PushQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(PushQueueProcessor.name);

  constructor(
    @InjectRepository(UserDevice)
    private readonly deviceRepo: Repository<UserDevice>,
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
  ) {
    super();
  }

  async process(job: Job<PushJobData>): Promise<void> {
    const { userId, notification } = job.data;

    const devices = await this.deviceRepo.find({
      where: { user_id: userId, active: true },
    });

    if (!devices.length) {
      this.logger.log(`No active devices for user ${userId}, skipping push`);
      return;
    }

    this.logger.log(
      `Sending push to ${devices.length} device(s) for user ${userId}: ${notification.title}`,
    );

    const message: MulticastMessage = {
      tokens: devices.map((d) => d.token),
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        type: notification.type,
        ...(notification.metadata as Record<string, string>),
      },
      android: { priority: 'high' },
    };

    const result: BatchResponse =
      await getMessaging().sendEachForMulticast(message);

    for (let i = 0; i < result.responses.length; i++) {
      const response = result.responses[i];
      const device = devices[i];

      await this.logRepo.save({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        metadata: notification.metadata ?? null,
      });

      if (!response.success) {
        const error = response.error;
        this.logger.warn(
          `FCM send failed for device ${device.id}: ${error?.message}`,
        );

        if (
          error?.code === 'messaging/registration-token-not-registered' ||
          error?.code === 'messaging/invalid-registration-token'
        ) {
          await this.deviceRepo.update(device.id, { active: false });
          this.logger.log(`Deactivated stale device token ${device.id}`);
        }
      }
    }

    this.logger.log(
      `Push sent: ${result.successCount} success, ${result.failureCount} failure(s)`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(`Push job ${job?.id} failed: ${error.message}`);
  }
}
