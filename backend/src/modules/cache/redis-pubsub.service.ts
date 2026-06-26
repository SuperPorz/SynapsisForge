import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@redis/client';

const CHANNEL_ENROLLMENTS = 'sf:enrollments';

@Injectable()
export class RedisPubSubService implements OnModuleInit {
  private readonly logger = new Logger(RedisPubSubService.name);
  private publisher!: ReturnType<typeof createClient>;
  private subscriber!: ReturnType<typeof createClient>;
  private redisUrl: string;

  constructor(configService: ConfigService) {
    this.redisUrl = configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );
  }

  async onModuleInit() {
    this.subscriber = createClient({ url: this.redisUrl });
    this.subscriber.on('error', (err) =>
      this.logger.error('Subscriber error', err),
    );
    await this.subscriber.connect();

    this.subscriber.subscribe(CHANNEL_ENROLLMENTS, (message: string) => {
      this.handleEnrollmentMessage(message).catch((err) =>
        this.logger.error('Failed to handle enrollment message', err),
      );
    });

    this.publisher = createClient({ url: this.redisUrl });
    this.publisher.on('error', (err) =>
      this.logger.error('Publisher error', err),
    );
    await this.publisher.connect();

    this.logger.log('Redis Pub/Sub initialized');
  }

  async publish(channel: string, data: Record<string, unknown>): Promise<void> {
    if (!this.publisher?.isOpen) {
      await this.publisher?.connect();
    }
    await this.publisher.publish(channel, JSON.stringify(data));
  }

  private async handleEnrollmentMessage(message: string): Promise<void> {
    const { courseId } = JSON.parse(message) as { courseId: string };
    const counterKey = `sf:enrollment-count:${courseId}`;
    const count = await this.publisher.incr(counterKey);
    if (count === 1) {
      await this.publisher.expire(counterKey, 86400);
    }
  }

  async getEnrollmentCount(courseId: string): Promise<number> {
    if (!this.publisher?.isOpen) return 0;
    const val = await this.publisher.get(`sf:enrollment-count:${courseId}`);
    return val ? Number(val) : 0;
  }

  async disconnect(): Promise<void> {
    await Promise.all([this.subscriber?.quit(), this.publisher?.quit()]);
  }
}
