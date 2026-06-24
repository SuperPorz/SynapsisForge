/* eslint-disable */
/**
 * redis-counter.seed.ts
 * ---------------------
 * Populates Redis enrollment counters from PostgreSQL enrollment data.
 * Run after seedEnrollments() so that Redis counters reflect existing data.
 *
 * Usage (called automatically from seed.ts):
 *   import { seedRedisCounters } from './redis-counter.seed';
 *   await seedRedisCounters();
 */

import { createClient } from '@redis/client';
import { AppDataSource } from '../../data-source';
import { Enrollment } from '../../common/entities/enrollments.entity';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export async function seedRedisCounters(): Promise<void> {
  const client = createClient({ url: REDIS_URL });
  client.on('error', () => {});

  try {
    await client.connect();
  } catch {
    console.log('  ⚠️  Redis not available — skipping counter seed');
    return;
  }

  try {
    await AppDataSource.initialize();

    const repo = AppDataSource.getRepository(Enrollment);
    const rows = await repo
      .createQueryBuilder('e')
      .select('e."courseId"', 'courseId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e."courseId"')
      .getRawMany();

    await AppDataSource.destroy();

    if (rows.length > 0) {
      const pipe = client.multi();
      for (const row of rows) {
        pipe.set(`sf:enrollment-count:${row.courseId}`, String(row.count));
      }
      await pipe.exec();
    }

    console.log(`  ✅ Redis: seeded ${rows.length} enrollment counters`);
  } catch (err) {
    console.log(`  ⚠️  Redis counter seed skipped: ${(err as Error).message}`);
  } finally {
    await client.quit();
  }
}
