import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { createClient } from '@redis/client';

type RedisClient = ReturnType<typeof createClient>;

const KEYV_PREFIX = 'keyv::keyv:';

export interface CacheStats {
  hit_rate: number | null;
  used_memory_human: string;
  used_memory_peak_human: string;
  total_keys: number;
  keys_by_prefix: Record<string, number>;
  evicted_keys: number;
  connected_clients: number;
  uptime_in_seconds: number;
  maxmemory_policy: string;
  maxmemory_human: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

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

  private getRedisClient(): RedisClient | null {
    const keyvStore = (this.cacheManager as Record<string, unknown>).stores as
      | Array<Record<string, unknown>>
      | undefined;
    if (!keyvStore?.[0]) return null;
    const store = keyvStore[0].opts as Record<string, unknown> | undefined;
    return (
      ((store?.store as Record<string, unknown> | undefined)
        ?.client as RedisClient | null) ?? null
    );
  }

  async getCacheStats(): Promise<CacheStats> {
    const client = this.getRedisClient();
    if (!client) {
      return {
        hit_rate: null,
        used_memory_human: 'N/A',
        used_memory_peak_human: 'N/A',
        total_keys: 0,
        keys_by_prefix: {},
        evicted_keys: 0,
        connected_clients: 0,
        uptime_in_seconds: 0,
        maxmemory_policy: 'N/A',
        maxmemory_human: 'N/A',
      };
    }

    if (!client.isOpen) await client.connect();

    const infoRaw = await client.info('stats');
    const infoMemory = await client.info('memory');
    const infoServer = await client.info('server');
    const infoClients = await client.info('clients');
    const dbSize = await client.dbSize();

    const allInfo = `${infoServer}\n${infoRaw}\n${infoMemory}\n${infoClients}`;

    const parseInfo = (section: string, key: string): string => {
      const re = new RegExp(`^${key}:(.+)$`, 'm');
      const m = section.match(re);
      return m ? m[1].trim() : '0';
    };

    const keyspaceHits = parseInt(parseInfo(infoRaw, 'keyspace_hits'), 10);
    const keyspaceMisses = parseInt(parseInfo(infoRaw, 'keyspace_misses'), 10);
    const totalOps = keyspaceHits + keyspaceMisses;
    const hitRate = totalOps > 0 ? keyspaceHits / totalOps : null;

    const keysByPrefix: Record<string, number> = {};
    let cursor = '0';
    const prefixes = [
      'sf:cache:',
      'sf:rate:',
      'sf:enrollment-count:',
      'keyv::',
    ];
    for (const prefix of prefixes) {
      let count = 0;
      cursor = '0';
      do {
        const result = await (client.scan(cursor, {
          MATCH: `${prefix}*`,
          COUNT: 500,
        }) as Promise<{ cursor: string; keys: string[] }>);
        cursor = result.cursor;
        count += result.keys.length;
      } while (cursor !== '0');
      keysByPrefix[prefix] = count;
    }

    return {
      hit_rate:
        hitRate !== null ? parseFloat((hitRate * 100).toFixed(2)) : null,
      used_memory_human: parseInfo(infoMemory, 'used_memory_human'),
      used_memory_peak_human: parseInfo(infoMemory, 'used_memory_peak_human'),
      total_keys: dbSize,
      keys_by_prefix: keysByPrefix,
      evicted_keys: parseInt(parseInfo(allInfo, 'evicted_keys'), 10),
      connected_clients: parseInt(
        parseInfo(infoClients, 'connected_clients'),
        10,
      ),
      uptime_in_seconds: parseInt(
        parseInfo(infoServer, 'uptime_in_seconds'),
        10,
      ),
      maxmemory_policy: parseInfo(infoMemory, 'maxmemory_policy'),
      maxmemory_human: parseInfo(infoMemory, 'maxmemory_human') || '0',
    };
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    const client = this.getRedisClient();
    if (!client?.scan) return;

    if (!client.isOpen) await client.connect();

    const fullPattern = `${KEYV_PREFIX}${pattern}`;
    let cursor = '0';
    const keysToDelete: string[] = [];

    do {
      const result = await (client.scan(cursor, {
        MATCH: fullPattern,
        COUNT: 100,
      }) as Promise<{ cursor: string; keys: string[] }>);
      cursor = result.cursor;
      const found = result.keys;
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
      slug
        ? this.cacheManager.del(`sf:cache:course:slug:${slug}`)
        : Promise.resolve(),
      this.invalidateByPattern('sf:cache:courses:list:*'),
    ]);
  }

  async invalidateCourseList(): Promise<void> {
    await this.invalidateByPattern('sf:cache:courses:list:*');
  }
}
