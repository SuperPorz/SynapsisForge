// prettier-ignore
/* eslint-disable */
/**
 * reset-and-seed.ts
 * -----------------
 * Svuota il database PostgreSQL e lo ripopola con i dati di seed.
 * Non richiede psql installato — usa pg direttamente.
 *
 * Utilizzo:
 *   npm run reset
 *
 * In package.json:
 *   "scripts": {
 *     "reset": "ts-node scripts/reset-and-seed.ts",
 *     "seed":  "ts-node scripts/seed.ts",
 *     "sync-ids": "ts-node scripts/sync-ids.ts"
 *   }
 */

import { Client } from 'pg';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// ── Config ───────────────────────────────────────────────────────────────────

const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'admin',
  password: 'qwerty',
  database: 'pg_database',
};

// ── Enums ────────────────────────────────────────────────────────────────────

enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}
enum Country {
  USA = 'USA',
  CANADA = 'CANADA',
  MEXICO = 'MEXICO',
  ITALY = 'ITALY',
  FRANCE = 'FRANCE',
  GERMANY = 'GERMANY',
  SPAIN = 'SPAIN',
  UK = 'UK',
}
enum CourseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}
enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
}
enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
enum Rating {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── STEP 1: RESET ─────────────────────────────────────────────────────────────

async function reset(): Promise<void> {
  console.log('🗑️  Reset database...\n');

  const client = new Client(DB_CONFIG);
  await client.connect();

  try {
    await client.query('BEGIN');

    // Ordine: foglie prima, radici dopo — rispetta le FK
    await client.query(`
      TRUNCATE TABLE
        certificates,
        reviews,
        payments,
        enrollments,
        lessons,
        courses,
        instructor_profiles,
        student_profiles,
        users,
        categories
      RESTART IDENTITY CASCADE
    `);

    await client.query('COMMIT');
    console.log('  ✅ Tutte le tabelle svuotate\n');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

// ── STEP 2: SEED ──────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log('🌱 Avvio seed...\n');

  const AppDataSource = new DataSource({
    type: 'postgres',
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    username: DB_CONFIG.user,
    password: DB_CONFIG.password,
    database: DB_CONFIG.database,
    synchronize: false,
  });

  await AppDataSource.initialize();
  const db = AppDataSource;

  try {
    // ── 1. CATEGORIES ────────────────────────────────────────────────────────
    console.log('  📂 Categories...');
    const categoryData = [
      {
        name: 'Web Development',
        description: 'Frontend, backend e fullstack web development',
      },
      {
        name: 'Data Science',
        description: 'Analisi dati, machine learning e statistiche',
      },
      {
        name: 'DevOps',
        description: 'CI/CD, containerizzazione e cloud infrastructure',
      },
      { name: 'Mobile', description: 'Sviluppo app iOS e Android' },
      {
        name: 'Cybersecurity',
        description: 'Sicurezza informatica e penetration testing',
      },
    ];

    const categories: any[] = [];
    for (const cat of categoryData) {
      const [inserted] = await db.query(
        `INSERT INTO categories (id, name, slug, description)
         VALUES (gen_random_uuid(), $1, $2, $3) RETURNING *`,
        [cat.name, slugify(cat.name), cat.description],
      );
      categories.push(inserted);
      console.log(`    ✅ ${cat.name}`);
    }

    // ── 2. USERS ─────────────────────────────────────────────────────────────
    console.log('\n  👤 Users...');
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const usersData = [
      {
        email: 'admin@synapsis.dev',
        first_name: 'Luca',
        last_name: 'Rossi',
        birth_date: '1985-03-12',
        country: Country.ITALY,
        role: UserRole.ADMIN,
      },
      {
        email: 'mario.bianchi@synapsis.dev',
        first_name: 'Mario',
        last_name: 'Bianchi',
        birth_date: '1988-07-22',
        country: Country.ITALY,
        role: UserRole.INSTRUCTOR,
      },
      {
        email: 'jane.smith@synapsis.dev',
        first_name: 'Jane',
        last_name: 'Smith',
        birth_date: '1990-11-05',
        country: Country.UK,
        role: UserRole.INSTRUCTOR,
      },
      {
        email: 'carlos.garcia@synapsis.dev',
        first_name: 'Carlos',
        last_name: 'Garcia',
        birth_date: '1987-02-18',
        country: Country.SPAIN,
        role: UserRole.INSTRUCTOR,
      },
      {
        email: 'alice@example.com',
        first_name: 'Alice',
        last_name: 'Dupont',
        birth_date: '1999-06-30',
        country: Country.FRANCE,
        role: UserRole.STUDENT,
      },
      {
        email: 'bob@example.com',
        first_name: 'Bob',
        last_name: 'Müller',
        birth_date: '2000-01-14',
        country: Country.GERMANY,
        role: UserRole.STUDENT,
      },
      {
        email: 'chiara@example.com',
        first_name: 'Chiara',
        last_name: 'Ferrari',
        birth_date: '1998-09-08',
        country: Country.ITALY,
        role: UserRole.STUDENT,
      },
      {
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Taylor',
        birth_date: '1995-04-25',
        country: Country.USA,
        role: UserRole.STUDENT,
      },
      {
        email: 'sofia@example.com',
        first_name: 'Sofia',
        last_name: 'Martinez',
        birth_date: '2001-12-03',
        country: Country.SPAIN,
        role: UserRole.STUDENT,
      },
    ];

    const users: any[] = [];
    for (const u of usersData) {
      const [inserted] = await db.query(
        `INSERT INTO users (id, email, password, first_name, last_name, birth_date, country, role)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          u.email,
          hashedPassword,
          u.first_name,
          u.last_name,
          u.birth_date,
          u.country,
          u.role,
        ],
      );
      users.push(inserted);
      console.log(`    ✅ ${u.email} (${u.role})`);
    }

    const instructorUsers = users.filter((u) => u.role === UserRole.INSTRUCTOR);
    const studentUsers = users.filter((u) => u.role === UserRole.STUDENT);

    // ── 3. INSTRUCTOR PROFILES ───────────────────────────────────────────────
    console.log('\n  🎓 Instructor profiles...');
    const instructorProfiles: any[] = [];
    for (const instructor of instructorUsers) {
      const [inserted] = await db.query(
        `INSERT INTO instructor_profiles ("userId") VALUES ($1) RETURNING *`,
        [instructor.id],
      );
      instructorProfiles.push(inserted);
      console.log(`    ✅ ${instructor.email}`);
    }

    // ── 4. STUDENT PROFILES ──────────────────────────────────────────────────
    console.log('\n  📚 Student profiles...');
    const studentProfiles: any[] = [];
    for (const student of studentUsers) {
      const [inserted] = await db.query(
        `INSERT INTO student_profiles ("userId") VALUES ($1) RETURNING *`,
        [student.id],
      );
      studentProfiles.push(inserted);
      console.log(`    ✅ ${student.email}`);
    }

    // ── 5. COURSES ───────────────────────────────────────────────────────────
    console.log('\n  📖 Courses...');
    const coursesData = [
      {
        title: 'NestJS Avanzato',
        description: 'Architetture scalabili con NestJS e TypeORM',
        price: 49.99,
        status: CourseStatus.PUBLISHED,
        thumbnail_url: 'https://picsum.photos/seed/nestjs/400/300',
        instructorEmail: 'mario.bianchi@synapsis.dev',
        categoryName: 'Web Development',
      },
      {
        title: 'React & TypeScript',
        description: 'Sviluppo frontend moderno con React e TS',
        price: 39.99,
        status: CourseStatus.PUBLISHED,
        thumbnail_url: 'https://picsum.photos/seed/react/400/300',
        instructorEmail: 'jane.smith@synapsis.dev',
        categoryName: 'Web Development',
      },
      {
        title: 'Python per Data Science',
        description: 'Pandas, NumPy e scikit-learn da zero',
        price: 59.99,
        status: CourseStatus.PUBLISHED,
        thumbnail_url: 'https://picsum.photos/seed/python/400/300',
        instructorEmail: 'carlos.garcia@synapsis.dev',
        categoryName: 'Data Science',
      },
      {
        title: 'Docker e Kubernetes',
        description: 'Containerizzazione e orchestrazione in produzione',
        price: 44.99,
        status: CourseStatus.PUBLISHED,
        thumbnail_url: 'https://picsum.photos/seed/docker/400/300',
        instructorEmail: 'mario.bianchi@synapsis.dev',
        categoryName: 'DevOps',
      },
      {
        title: 'Ethical Hacking',
        description: 'Penetration testing e sicurezza offensiva',
        price: 69.99,
        status: CourseStatus.PUBLISHED,
        thumbnail_url: 'https://picsum.photos/seed/hack/400/300',
        instructorEmail: 'jane.smith@synapsis.dev',
        categoryName: 'Cybersecurity',
      },
      {
        title: 'Flutter per principianti',
        description: 'Crea app mobile cross-platform con Flutter',
        price: 34.99,
        status: CourseStatus.DRAFT,
        thumbnail_url: 'https://picsum.photos/seed/flutter/400/300',
        instructorEmail: 'carlos.garcia@synapsis.dev',
        categoryName: 'Mobile',
      },
    ];

    const courses: any[] = [];
    for (const c of coursesData) {
      const instructorUser = users.find((u) => u.email === c.instructorEmail);
      const instructorProfile = instructorProfiles.find(
        (p) => p.userId === instructorUser?.id,
      );
      const category = categories.find((cat) => cat.name === c.categoryName);

      const [inserted] = await db.query(
        `INSERT INTO courses (id, title, slug, description, price, status, thumbnail_url, "instructorUserId", "categoryId")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          c.title,
          slugify(c.title),
          c.description,
          c.price,
          c.status,
          c.thumbnail_url,
          instructorProfile.userId,
          category.id,
        ],
      );
      courses.push({ ...inserted, _status: c.status });
      console.log(`    ✅ ${c.title} (${c.status})`);
    }

    const publishedCourses = courses.filter(
      (c) => c._status === CourseStatus.PUBLISHED,
    );

    // ── 6. LESSONS ───────────────────────────────────────────────────────────
    console.log('\n  🎬 Lessons...');
    for (const course of publishedCourses) {
      const lessonCount = randomInt(4, 6);
      for (let i = 1; i <= lessonCount; i++) {
        await db.query(
          `INSERT INTO lessons (id, title, "order", duration_seconds, content_id, "courseId")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
          [
            `Lezione ${i} - ${course.title}`,
            i,
            randomInt(600, 3600),
            `content-${slugify(course.title)}-${i}`,
            course.id,
          ],
        );
      }
      console.log(`    ✅ ${lessonCount} lezioni → ${course.title}`);
    }

    // ── 7. ENROLLMENTS + PAYMENTS + REVIEWS + CERTIFICATES ───────────────────
    console.log('\n  📝 Enrollments, payments, reviews, certificates...');

    for (const studentProfile of studentProfiles) {
      const studentUser = studentUsers.find(
        (u) => u.id === studentProfile.userId,
      );
      const coursesToEnroll = publishedCourses.slice(0, randomInt(2, 3));

      for (let ci = 0; ci < coursesToEnroll.length; ci++) {
        const course = coursesToEnroll[ci];

        // Il primo corso di ogni studente è sempre al 100% → garantisce certificati
        const progress = ci === 0 ? 100 : randomInt(10, 99);
        const completed = progress === 100 ? new Date().toISOString() : null;

        const [enrollment] = await db.query(
          `INSERT INTO enrollments (id, "studentUserId", "courseId", progress_percent, completed_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *`,
          [studentProfile.userId, course.id, progress, completed],
        );
        console.log(
          `    ✅ Enrollment: ${studentUser?.email} → ${course.title} (${progress}%)`,
        );

        // Payment
        await db.query(
          `INSERT INTO payments (id, "userId", "courseId", amount, currency, gateway_id, status)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
          [
            studentProfile.userId,
            course.id,
            course.price,
            randomElement([Currency.EUR, Currency.USD, Currency.GBP]),
            `gw_${Date.now()}_${randomInt(1000, 9999)}`,
            PaymentStatus.COMPLETED,
          ],
        );

        // Review (solo se progress > 50%)
        if (progress > 50) {
          const rating = randomElement([
            Rating.THREE,
            Rating.FOUR,
            Rating.FOUR,
            Rating.FIVE,
          ]);
          const comment = randomElement([
            'Corso molto ben strutturato, lo consiglio!',
            'Ottimi contenuti, il docente spiega benissimo.',
            'Qualche parte potrebbe essere più approfondita, ma nel complesso ottimo.',
            null,
          ]);
          await db.query(
            `INSERT INTO reviews (id, rating, comment, "enrollmentId")
             VALUES (gen_random_uuid(), $1, $2, $3)`,
            [rating, comment, enrollment.id],
          );
          console.log(`    ✅ Review: ${studentUser?.email} → ⭐ ${rating}`);
        }

        // Certificate (solo se completato al 100%)
        if (completed !== null) {
          await db.query(
            `INSERT INTO certificates (id, "enrollmentId", pdf_url, certificate_code)
             VALUES (gen_random_uuid(), $1, $2, gen_random_uuid())`,
            [
              enrollment.id,
              `https://synapsis.dev/certificates/${enrollment.id}.pdf`,
            ],
          );
          console.log(`    ✅ Certificato → ${studentUser?.email}`);
        }
      }
    }
  } finally {
    await AppDataSource.destroy();
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🚀 reset-and-seed — Synapsis/SynapsisForge\n');
  console.log(
    `   DB: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}\n`,
  );
  console.log('─'.repeat(55));

  try {
    await reset();
    console.log('─'.repeat(55));
    await seed();
    console.log('─'.repeat(55));
    console.log('\n🎉 Reset e seed completati!\n');
    console.log('   Prossimo passo: npm run sync-ids\n');
  } catch (err) {
    console.error('\n❌ Errore:', (err as Error).message);
    console.error(err);
    process.exit(1);
  }
}

main();
