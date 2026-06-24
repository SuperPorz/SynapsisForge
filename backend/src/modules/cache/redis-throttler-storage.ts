import { createClient } from '@redis/client';
import type { ThrottlerStorage } from '@nestjs/throttler';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

const THROTTLE_PREFIX = 'sf:rate:throttle';
const BLOCK_PREFIX = 'sf:rate:block';

export class RedisThrottlerStorage implements ThrottlerStorage {
  private client: ReturnType<typeof createClient>;

  constructor(redisUrl: string) {
    this.client = createClient({ url: redisUrl });
    this.client.on('error', () => {});
  }

  private async ensureConnected(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    await this.ensureConnected();

    const counterKey = `${THROTTLE_PREFIX}:${throttlerName}:${key}`;
    const blockKey = `${BLOCK_PREFIX}:${throttlerName}:${key}`;

    const blockedTtl = await this.client.ttl(blockKey);
    if (blockedTtl > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: blockedTtl,
      };
    }

    const totalHits = await this.client.incr(counterKey);
    if (totalHits === 1) {
      await this.client.expire(counterKey, Math.ceil(ttl / 1000));
    }

    const timeToExpire = await this.client.ttl(counterKey);

    let isBlocked = false;
    let timeToBlockExpire = 0;

    if (totalHits > limit) {
      await this.client.setEx(blockKey, Math.ceil(blockDuration / 1000), '1');
      timeToBlockExpire = blockDuration / 1000;
      isBlocked = true;
    }

    return {
      totalHits,
      timeToExpire: timeToExpire < 0 ? 0 : timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }
}
