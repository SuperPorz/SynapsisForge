// prettier-ignore
/* eslint-disable */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// ── Enums (inline per non dipendere dai path del progetto) ──────────────────
enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}
enum Country {
  USA = 'USA',
  CANADA = 'CANADA',
  ITALY = 'ITALY',
  FRANCE = 'FRANCE',
  GERMANY = 'GERMANY',
  SPAIN = 'SPAIN',
  UK = 'UK',
}
enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
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

// ── Connessione ─────────────────────────────────────────────────────────────
const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'admin',
  password: 'qwerty',
  database: 'pg_database',
  synchronize: false,
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function slug(text: string): string {
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

// ── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  await AppDataSource.initialize();
  const db = AppDataSource;

  console.log('🌱 Avvio seed...\n');

  // ── 1. CATEGORIES ──────────────────────────────────────────────────────────
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
    const existing = await db.query(
      `SELECT id FROM categories WHERE name = $1`,
      [cat.name],
    );
    if (existing.length === 0) {
      const [inserted] = await db.query(
        `INSERT INTO categories (id, name, slug, description) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING *`,
        [cat.name, slug(cat.name), cat.description],
      );
      categories.push(inserted);
      console.log(`  ✅ Categoria: ${cat.name}`);
    } else {
      categories.push(existing[0]);
      console.log(`  ⏭️  Categoria già esistente: ${cat.name}`);
    }
  }

  // ── 2. USERS ───────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const usersData = [
    // Admin
    {
      email: 'admin@synapsis.dev',
      first_name: 'Luca',
      last_name: 'Rossi',
      birth_date: '1985-03-12',
      country: Country.ITALY,
      role: UserRole.ADMIN,
    },
    // Instructors
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
    // Students
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
    const existing = await db.query(`SELECT * FROM users WHERE email = $1`, [
      u.email,
    ]);
    if (existing.length === 0) {
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
      console.log(`  ✅ User: ${u.email} (${u.role})`);
    } else {
      users.push(existing[0]);
      console.log(`  ⏭️  User già esistente: ${u.email}`);
    }
  }

  const instructors = users.filter((u) => u.role === UserRole.INSTRUCTOR);
  const students = users.filter((u) => u.role === UserRole.STUDENT);

  // ── 3. COURSES ─────────────────────────────────────────────────────────────
  const coursesData = [
    {
      title: 'NestJS Avanzato',
      description: 'Architetture scalabili con NestJS e TypeORM',
      price: 49.99,
      status: CourseStatus.PUBLISHED,
      thumbnail_url: 'https://picsum.photos/seed/nestjs/400/300',
      instructorIndex: 0,
      categoryName: 'Web Development',
    },
    {
      title: 'React & TypeScript',
      description: 'Sviluppo frontend moderno con React e TS',
      price: 39.99,
      status: CourseStatus.PUBLISHED,
      thumbnail_url: 'https://picsum.photos/seed/react/400/300',
      instructorIndex: 1,
      categoryName: 'Web Development',
    },
    {
      title: 'Python per Data Science',
      description: 'Pandas, NumPy e scikit-learn da zero',
      price: 59.99,
      status: CourseStatus.PUBLISHED,
      thumbnail_url: 'https://picsum.photos/seed/python/400/300',
      instructorIndex: 2,
      categoryName: 'Data Science',
    },
    {
      title: 'Docker e Kubernetes',
      description: 'Containerizzazione e orchestrazione in produzione',
      price: 44.99,
      status: CourseStatus.PUBLISHED,
      thumbnail_url: 'https://picsum.photos/seed/docker/400/300',
      instructorIndex: 0,
      categoryName: 'DevOps',
    },
    {
      title: 'Ethical Hacking',
      description: 'Penetration testing e sicurezza offensiva',
      price: 69.99,
      status: CourseStatus.PUBLISHED,
      thumbnail_url: 'https://picsum.photos/seed/hack/400/300',
      instructorIndex: 1,
      categoryName: 'Cybersecurity',
    },
    {
      title: 'Flutter per principianti',
      description: 'Crea app mobile cross-platform con Flutter',
      price: 34.99,
      status: CourseStatus.DRAFT,
      thumbnail_url: 'https://picsum.photos/seed/flutter/400/300',
      instructorIndex: 2,
      categoryName: 'Mobile',
    },
  ];

  const courses: any[] = [];
  for (const c of coursesData) {
    const existing = await db.query(`SELECT * FROM courses WHERE title = $1`, [
      c.title,
    ]);
    if (existing.length === 0) {
      const instructor = instructors[c.instructorIndex];
      const category = categories.find((cat) => cat.name === c.categoryName);
      const [inserted] = await db.query(
        `INSERT INTO courses (id, title, slug, description, price, status, thumbnail_url, "instructorId", "categoryId")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          c.title,
          slug(c.title),
          c.description,
          c.price,
          c.status,
          c.thumbnail_url,
          instructor.id,
          category.id,
        ],
      );
      courses.push(inserted);
      console.log(`  ✅ Corso: ${c.title}`);
    } else {
      courses.push(existing[0]);
      console.log(`  ⏭️  Corso già esistente: ${c.title}`);
    }
  }

  const publishedCourses = courses.filter(
    (_, i) => coursesData[i]?.status === CourseStatus.PUBLISHED,
  );

  // ── 4. LESSONS ─────────────────────────────────────────────────────────────
  console.log('\n  Inserimento lezioni...');
  for (const course of publishedCourses) {
    const existing = await db.query(
      `SELECT id FROM lessons WHERE "courseId" = $1`,
      [course.id],
    );
    if (existing.length > 0) {
      console.log(`  ⏭️  Lezioni già esistenti per: ${course.title}`);
      continue;
    }

    const lessonCount = randomInt(4, 6);
    for (let i = 1; i <= lessonCount; i++) {
      await db.query(
        `INSERT INTO lessons (id, title, "order", duration_seconds, content_id, "courseId")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
        [
          `Lezione ${i} - ${course.title}`,
          i,
          randomInt(600, 3600),
          `content-${slug(course.title)}-${i}`,
          course.id,
        ],
      );
    }
    console.log(`  ✅ ${lessonCount} lezioni per: ${course.title}`);
  }

  // ── 5. ENROLLMENTS + PAYMENTS + REVIEWS + CERTIFICATES ────────────────────
  console.log('\n  Inserimento enrollment, pagamenti, recensioni...');

  const enrollments: any[] = [];

  for (const student of students) {
    // Ogni studente si iscrive a 2-3 corsi pubblicati
    const coursesToEnroll = publishedCourses.slice(0, randomInt(2, 3));

    for (const course of coursesToEnroll) {
      const existingEnroll = await db.query(
        `SELECT * FROM enrollments WHERE "userId" = $1 AND "courseId" = $2`,
        [student.id, course.id],
      );

      let enrollment: any;
      if (existingEnroll.length === 0) {
        const progress = randomInt(0, 100);
        const completed = progress === 100 ? new Date().toISOString() : null;
        const [inserted] = await db.query(
          `INSERT INTO enrollments (id, "userId", "courseId", progress_percent, completed_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *`,
          [student.id, course.id, progress, completed],
        );
        enrollment = inserted;
        console.log(
          `  ✅ Enrollment: ${student.email} → ${course.title} (${progress}%)`,
        );
      } else {
        enrollment = existingEnroll[0];
        console.log(
          `  ⏭️  Enrollment già esistente: ${student.email} → ${course.title}`,
        );
      }

      enrollments.push(enrollment);

      // Payment
      const existingPayment = await db.query(
        `SELECT id FROM payments WHERE "userId" = $1 AND "courseId" = $2`,
        [student.id, course.id],
      );
      if (existingPayment.length === 0) {
        const currencies = [Currency.EUR, Currency.USD, Currency.GBP];
        await db.query(
          `INSERT INTO payments (id, "userId", "courseId", amount, currency, gateway_id, status)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
          [
            student.id,
            course.id,
            course.price,
            randomElement(currencies),
            `gw_${Date.now()}_${randomInt(1000, 9999)}`,
            PaymentStatus.COMPLETED,
          ],
        );
        console.log(`  ✅ Payment: ${student.email} → ${course.price}€`);
      }

      // Review (solo se progress > 50%)
      if (enrollment.progress_percent > 50) {
        const existingReview = await db.query(
          `SELECT id FROM reviews WHERE "enrollmentId" = $1`,
          [enrollment.id],
        );
        if (existingReview.length === 0) {
          const rating = randomElement([
            Rating.THREE,
            Rating.FOUR,
            Rating.FOUR,
            Rating.FIVE,
          ]);
          const comments = [
            'Corso molto ben strutturato, lo consiglio!',
            'Ottimi contenuti, il docente spiega benissimo.',
            'Qualche parte potrebbe essere più approfondita, ma nel complesso ottimo.',
            null,
          ];
          await db.query(
            `INSERT INTO reviews (id, rating, comment, "enrollmentId") VALUES (gen_random_uuid(), $1, $2, $3)`,
            [rating, randomElement(comments), enrollment.id],
          );
          console.log(`  ✅ Review: ${student.email} → ⭐ ${rating}`);
        }
      }

      // Certificate (solo se completato al 100%)
      if (enrollment.completed_at !== null) {
        const existingCert = await db.query(
          `SELECT id FROM certificates WHERE "enrollmentId" = $1`,
          [enrollment.id],
        );
        if (existingCert.length === 0) {
          await db.query(
            `INSERT INTO certificates (id, "enrollmentId", pdf_url) VALUES (gen_random_uuid(), $1, $2)`,
            [
              enrollment.id,
              `https://synapsis.dev/certificates/${enrollment.id}.pdf`,
            ],
          );
          console.log(`  ✅ Certificato emesso per: ${student.email}`);
        }
      }
    }
  }

  await AppDataSource.destroy();
  console.log('\n🎉 Seed completato con successo!');
}

seed().catch((err) => {
  console.error('❌ Errore durante il seed:', err);
  process.exit(1);
});
