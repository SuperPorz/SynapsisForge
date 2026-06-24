import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

const KEYV_PREFIX = 'keyv::keyv:';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    const keyvStore = (this.cacheManager as any).stores?.[0];
    if (!keyvStore) return;

    const redisClient = keyvStore.opts?.store?.client;
    if (!redisClient?.scan) return;

    if (!redisClient.isOpen) await redisClient.connect();

    const fullPattern = `${KEYV_PREFIX}${pattern}`;
    let cursor = '0';
    const keysToDelete: string[] = [];

    do {
      const result = await redisClient.scan(cursor, { MATCH: fullPattern, COUNT: 100 });
      cursor = result.cursor;
      const found = result.keys as string[];
      keysToDelete.push(
        ...found.map((k: string) => k.slice(KEYV_PREFIX.length)),
      );
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map((k) => this.cacheManager.del(k)));
    }
  }

  async invalidateCourse(id: string, slug?: string): Promise<void> {
    await Promise.all([
      this.cacheManager.del(`sf:cache:course:${id}`),
      slug ? this.cacheManager.del(`sf:cache:course:slug:${slug}`) : Promise.resolve(),
      this.invalidateByPattern('sf:cache:courses:list:*'),
    ]);
  }

  async invalidateCourseList(): Promise<void> {
    await this.invalidateByPattern('sf:cache:courses:list:*');
  }
}
