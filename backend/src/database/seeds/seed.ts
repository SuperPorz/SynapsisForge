import 'dotenv/config';
import { AppDataSource } from '../../data-source';
import { seedCategories } from './categories.seed';
import { seedUsers } from './users.seed';
import { seedCourses } from './courses.seed';
import { seedEnrollments } from './enrollments.seed';
import { seedMongo } from './mongo.seed';

async function main() {
  await AppDataSource.initialize();
  console.log('📦 PostgreSQL connesso');

  const categories = await seedCategories(AppDataSource);
  const { instructors, students } = await seedUsers(AppDataSource);
  const courses = await seedCourses(AppDataSource, categories, instructors);
  await seedEnrollments(AppDataSource, courses, students);

  await AppDataSource.destroy();
  console.log('🔌 PostgreSQL disconnesso');

  // MongoDB
  await seedMongo();

  console.log('🎉 Seed completato con successo');
}

main().catch((err) => {
  console.error('❌ Seed fallito:', err);
  process.exit(1);
});
