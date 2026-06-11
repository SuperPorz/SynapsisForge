import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../data-source';
import { Course } from '../../common/entities/courses.entity';
import { Section } from '../../common/entities/section.entity';
import { Lesson } from '../../common/entities/lessons.entity';
import { Status } from '../../common/entities/enum/courses.enum';

const SECTIONS_TEMPLATE = [
  {
    title: 'Introduzione',
    order: 1,
    lessons: [
      { title: 'Panoramica del corso', order: 1, duration_seconds: 300 },
      { title: 'Setup ambiente', order: 2, duration_seconds: 600 },
    ],
  },
  {
    title: 'Fondamentali',
    order: 2,
    lessons: [
      { title: 'Concetti base', order: 1, duration_seconds: 900 },
      { title: 'Primo progetto pratico', order: 2, duration_seconds: 1200 },
    ],
  },
  {
    title: 'Approfondimenti',
    order: 3,
    lessons: [
      { title: 'Pattern avanzati', order: 1, duration_seconds: 1500 },
      { title: 'Best practices', order: 2, duration_seconds: 900 },
      { title: 'Progetto finale', order: 3, duration_seconds: 1800 },
    ],
  },
];

export async function seedSections(ds: typeof AppDataSource): Promise<void> {
  const courseRepo = ds.getRepository(Course);
  const sectionRepo = ds.getRepository(Section);
  const lessonRepo = ds.getRepository(Lesson);

  const courses = await courseRepo.find({
    where: { status: Status.PUBLISHED },
  });

  console.log(`📚 Trovati ${courses.length} corsi PUBLISHED`);

  for (const course of courses) {
    for (const sectionData of SECTIONS_TEMPLATE) {
      const section = sectionRepo.create({
        title: sectionData.title,
        order: sectionData.order,
        course,
      });
      const savedSection = await sectionRepo.save(section);

      const lessons = sectionData.lessons.map((l) =>
        lessonRepo.create({
          title: l.title,
          order: l.order,
          duration_seconds: l.duration_seconds,
          content_id: uuidv4(),
          course,
          section: savedSection,
        }),
      );
      await lessonRepo.save(lessons);
    }

    console.log(`  ✅ Sezioni e lezioni create per: "${course.title}"`);
  }
}

async function main() {
  await AppDataSource.initialize();
  console.log('📦 PostgreSQL connesso');

  await seedSections(AppDataSource);

  await AppDataSource.destroy();
  console.log('🔌 PostgreSQL disconnesso');
  console.log('🎉 Seed sezioni completato');
}

main().catch((err) => {
  console.error('❌ Seed fallito:', err);
  process.exit(1);
});
