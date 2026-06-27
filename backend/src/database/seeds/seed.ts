/* eslint-disable */
/**
 * seed.ts
 * -------
 * Main seed orchestrator for SynapsisForge.
 * Runs all seeds in dependency order and passes real IDs between them.
 *
 * PostgreSQL seeds run first, then MongoDB receives real lesson UUIDs from PG.
 * This guarantees LessonContent.lessonId always matches a real Lesson.id.
 *
 * Usage:
 *   npm run db:seed
 *
 * Full reset + seed:
 *   npm run db:reset && npm run db:seed
 */

import { config } from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  config({ path: '.env.development' });
}
import { AppDataSource } from '../../data-source';
import { seedCategories } from './categories.seed';
import { seedUsers } from './users.seed';
import { seedCourses } from './courses.seed';
import { seedSections } from './sections.seed';
import { seedEnrollments } from './enrollments.seed';
import { seedRatings } from './ratings.seed';
import { seedMongo } from './mongo.seed';
import { seedRedisCounters } from './redis-counter.seed';
import { seedPayments } from './payments.seed';
import { Course } from '../../common/entities/courses.entity';
import { Lesson } from '../../common/entities/lessons.entity';

async function main(): Promise<void> {
  console.log('🌱 SynapsisForge — Database Seed\n');
  console.log('─'.repeat(55));

  // ── PostgreSQL ─────────────────────────────────────────────────────────────
  await AppDataSource.initialize();
  console.log('📦 PostgreSQL connected\n');

  try {
    console.log('📂 Categories...');
    const categories = await seedCategories(AppDataSource);

    console.log('\n👤 Users...');
    const { instructorProfiles, studentProfiles } = await seedUsers(AppDataSource);

    console.log('\n📖 Courses...');
    // Load courses with category relation so sections.seed can resolve categorySlug
    const courses = await seedCourses(AppDataSource, categories, instructorProfiles);

    // Reload courses with category relation for sections seed
    const corso = Course;
    const courseRepo = AppDataSource.getRepository(corso);
    const coursesWithCategory = await courseRepo.find({ relations: ['category'] });

    console.log('\n🎬 Sections & Lessons...');
    const seededLessons = await seedSections(AppDataSource, coursesWithCategory);

    console.log('\n📝 Enrollments, Payments, Certificates...');
    const seededEnrollments = await seedEnrollments(AppDataSource, courses, studentProfiles);

    console.log('\n⭐ Reviews...');
    await seedRatings(AppDataSource, seededEnrollments);

    console.log('\n💳 Payments...');
    await seedPayments(AppDataSource, courses, studentProfiles);

  } finally {
    await AppDataSource.destroy();
    console.log('\n🔌 PostgreSQL disconnected');
  }

  // ── MongoDB ────────────────────────────────────────────────────────────────
  // seededLessons carries real PG UUIDs — MongoDB gets them directly
  console.log('\n🍃 MongoDB...');

  // Re-fetch seeded lessons to pass to Mongo seed
  // (AppDataSource is destroyed above; we use a fresh connection)
  await AppDataSource.initialize();
  const lezione = Lesson;
  const lessonRepo = AppDataSource.getRepository(lezione);
  const allLessons = await lessonRepo.find({ relations: ['course'] });
  await AppDataSource.destroy();

  const seededLessonsForMongo = allLessons.map((l) => ({
    id: l.id,
    title: l.title,
    courseId: (l as any).courseId ?? l.course?.id ?? '',
    courseTitle: l.course?.title ?? '',
  }));

  await seedMongo(seededLessonsForMongo);

  // ── Redis ───────────────────────────────────────────────────────────────────
  console.log('\n🔴 Redis enrollment counters...');
  await seedRedisCounters();

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(55));
  console.log('🎉 Seed complete!\n');
  console.log('  Accounts (password: Password123!):');
  console.log('  Admin:       admin@example.com');
  console.log('  Instructor:  james.carter@synapsis.dev');
  console.log('  Instructor:  sofia.esposito@synapsis.dev');
  console.log('  Instructor:  marco.weber@synapsis.dev');
  console.log('  Student:     alice@example.com  (+ 7 more)');
  console.log('  Unverified:  unverified1@example.com, unverified2@example.com');
  console.log('\n  Run "npm run sync-ids" to update .rest test files.\n');
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', (err as Error).message);
  console.error(err);
  process.exit(1);
});
