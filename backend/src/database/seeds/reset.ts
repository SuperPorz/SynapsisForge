/* eslint-disable */
/**
 * reset.ts
 * --------
 * Truncates all PostgreSQL tables (FK-safe order) and drops MongoDB collections.
 * Run before seed.ts to start from a clean slate.
 *
 * Usage:
 *   npm run db:reset
 */

import { config } from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  config({ path: '.env.development' });
}
import { Client } from 'pg';
import mongoose from 'mongoose';
import { createClient } from '@redis/client';
import { getMongoUri } from '../shared/mongo-uri.util';

async function resetPostgres(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  await client.connect();

  try {
    await client.query('BEGIN');

    // Leaf tables first, then parent tables — respects all FK constraints
    await client.query(`
      TRUNCATE TABLE
        certificates,
        reviews,
        payments,
        enrollments,
        lessons,
        sections,
        courses,
        instructor_profiles,
        student_profiles,
        user_providers,
        users,
        categories
      RESTART IDENTITY CASCADE
    `);

    await client.query('COMMIT');
    console.log('  ✅ PostgreSQL: all tables truncated');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

async function resetMongo(): Promise<void> {
  const uri = getMongoUri();

  await mongoose.connect(uri);

  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();

  for (const col of collections) {
    await db.collection(col.name).drop();
    console.log(`  ✅ MongoDB: dropped collection "${col.name}"`);
  }

  await mongoose.disconnect();
}

async function resetRedis(): Promise<void> {
  const client = createClient({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  });
  client.on('error', () => {});

  try {
    await client.connect();
    await client.flushDb();
    console.log('  ✅ Redis: all keys flushed');
  } catch {
    console.log('  ⚠️  Redis not available — skipping flush');
  } finally {
    await client.quit();
  }
}

async function main(): Promise<void> {
  console.log('🗑️  Resetting databases...\n');

  try {
    await resetPostgres();
    await resetMongo();
    await resetRedis();
    console.log('\n✅ Reset complete. Run "npm run db:seed" to repopulate.\n');
  } catch (err) {
    console.error('\n❌ Reset failed:', (err as Error).message);
    process.exit(1);
  }
}

main();
