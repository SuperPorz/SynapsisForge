/* eslint-disable */
import { config } from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  config({ path: '.env.development' });
}
import { AppDataSource } from '../../data-source';
import { seedMongo } from './mongo.seed';
import { Lesson } from '../../common/entities/lessons.entity';

async function main(): Promise<void> {
  console.log('🍃 SynapsisForge — MongoDB-only seed\n');

  await AppDataSource.initialize();
  const lessonRepo = AppDataSource.getRepository(Lesson);
  const allLessons = await lessonRepo.find({ relations: ['course'] });
  await AppDataSource.destroy();

  const seededLessons = allLessons.map((l) => ({
    id: l.id,
    title: l.title,
    courseId: (l as any).courseId ?? l.course?.id ?? '',
    courseTitle: l.course?.title ?? '',
  }));

  await seedMongo(seededLessons);

  console.log('🎉 MongoDB seed complete!\n');
}

main().catch((err) => {
  console.error('\n❌ MongoDB seed failed:', (err as Error).message);
  process.exit(1);
});
