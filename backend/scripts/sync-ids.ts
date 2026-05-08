/**
 * sync-ids.ts
 * -----------
 * Aggiorna le variabili UUID nei file .rest interrogando PostgreSQL direttamente.
 * Non richiede che il server NestJS sia in esecuzione.
 * Non dipende da guard o token JWT.
 *
 * Utilizzo:
 *   npm run sync-ids
 *
 * In package.json:
 *   "scripts": {
 *     "sync-ids": "ts-node scripts/sync-ids.ts"
 *   }
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// ── Config — stessi valori del seed.ts ──────────────────────────────────────

const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'admin',
  password: 'qwerty',
  database: 'pg_database',
};

// Cartella dei file .rest — relativa alla root del progetto
const REST_DIR = path.resolve(process.cwd(), 'test', 'rest');

// ── Mappa placeholder → valore reale ────────────────────────────────────────

const ids: Record<string, string> = {
  ADMIN_UUID: '',
  STUDENT_UUID: '',
  INSTRUCTOR_UUID: '',
  COURSE_UUID: '',
  CATEGORY_UUID: '',
  SLUG_VALUE: '',
  LESSON_UUID: '',
  ENROLLMENT_UUID: '',
  CERTIFICATE_UUID: '',
  CERTIFICATE_CODE_UUID: '',
  REVIEW_UUID: '',
  ADMIN_JWT_TOKEN: 'TODO_login_per_token',
  STUDENT_JWT_TOKEN: 'TODO_login_per_token',
  INSTRUCTOR_JWT_TOKEN: 'TODO_login_per_token',
};

// ── Raccolta UUID dal DB ─────────────────────────────────────────────────────

async function collectIds(client: Client): Promise<void> {
  console.log('🔍 Raccolta UUID dal database...\n');

  // ── Users per ruolo ─────────────────────────────────────────────────
  const usersRes = await client.query<{
    id: string;
    role: string;
    email: string;
  }>(
    `SELECT id, role, email FROM users WHERE is_active = true ORDER BY "createdAt" ASC`,
  );

  const admin = usersRes.rows.find((u) => u.role === 'ADMIN');
  const student = usersRes.rows.find((u) => u.role === 'STUDENT');
  const instructor = usersRes.rows.find((u) => u.role === 'INSTRUCTOR');

  if (admin) {
    ids.ADMIN_UUID = admin.id;
    console.log(`  ✅ adminId:      ${admin.id}  (${admin.email})`);
  } else console.warn('  ⚠️  Nessun ADMIN nel DB');

  if (student) {
    ids.STUDENT_UUID = student.id;
    console.log(`  ✅ studentId:    ${student.id}  (${student.email})`);
  } else console.warn('  ⚠️  Nessuno STUDENT nel DB');

  if (instructor) {
    ids.INSTRUCTOR_UUID = instructor.id;
    console.log(`  ✅ instructorId: ${instructor.id}  (${instructor.email})`);
  } else console.warn('  ⚠️  Nessun INSTRUCTOR nel DB');

  // ── Primo corso pubblicato ───────────────────────────────────────────
  const courseRes = await client.query<{
    id: string;
    slug: string;
    category_id: string;
  }>(
    `SELECT c.id, c.slug, c."categoryId" AS category_id
     FROM courses c
     WHERE c.status = 'PUBLISHED' AND c.deleted_at IS NULL
     ORDER BY c.created_at ASC
     LIMIT 1`,
  );

  if (courseRes.rows.length > 0) {
    const course = courseRes.rows[0];
    ids.COURSE_UUID = course.id;
    ids.SLUG_VALUE = course.slug ?? '';
    ids.CATEGORY_UUID = course.category_id ?? '';
    console.log(`  ✅ courseId:     ${course.id}`);
    console.log(`  ✅ slug:         ${course.slug}`);
    console.log(`  ✅ categoryId:   ${course.category_id}`);
  } else {
    console.warn('  ⚠️  Nessun corso PUBLISHED nel DB');
  }

  // ── Prima lezione del corso trovato ─────────────────────────────────
  if (ids.COURSE_UUID) {
    const lessonRes = await client.query<{ id: string }>(
      `SELECT id FROM lessons
       WHERE "courseId" = $1 AND deleted_at IS NULL
       ORDER BY "order" ASC
       LIMIT 1`,
      [ids.COURSE_UUID],
    );
    if (lessonRes.rows.length > 0) {
      ids.LESSON_UUID = lessonRes.rows[0].id;
      console.log(`  ✅ lessonId:     ${lessonRes.rows[0].id}`);
    } else {
      console.warn('  ⚠️  Nessuna lezione trovata per il corso');
    }
  }

  // ── Primo enrollment ─────────────────────────────────────────────────
  const enrollRes = await client.query<{ id: string }>(
    `SELECT id FROM enrollments ORDER BY enrolled_at ASC LIMIT 1`,
  );
  if (enrollRes.rows.length > 0) {
    ids.ENROLLMENT_UUID = enrollRes.rows[0].id;
    console.log(`  ✅ enrollmentId: ${enrollRes.rows[0].id}`);
  } else {
    console.warn('  ⚠️  Nessun enrollment nel DB');
  }

  // ── Primo certificato ────────────────────────────────────────────────
  const certRes = await client.query<{ id: string; certificate_code: string }>(
    `SELECT id, certificate_code FROM certificates LIMIT 1`,
  );
  if (certRes.rows.length > 0) {
    ids.CERTIFICATE_UUID = certRes.rows[0].id;
    ids.CERTIFICATE_CODE_UUID = certRes.rows[0].certificate_code;
    console.log(`  ✅ certificateId:   ${certRes.rows[0].id}`);
    console.log(`  ✅ certificateCode: ${certRes.rows[0].certificate_code}`);
  } else {
    console.warn(
      '  ⚠️  Nessun certificato nel DB (serve un enrollment al 100%)',
    );
  }

  // ── Prima review ─────────────────────────────────────────────────────
  const reviewRes = await client.query<{ id: string }>(
    `SELECT id FROM reviews ORDER BY created_at ASC LIMIT 1`,
  );
  if (reviewRes.rows.length > 0) {
    ids.REVIEW_UUID = reviewRes.rows[0].id;
    console.log(`  ✅ reviewId:     ${reviewRes.rows[0].id}`);
  } else {
    console.warn('  ⚠️  Nessuna review nel DB');
  }
}

// ── Aggiornamento file .rest ─────────────────────────────────────────────────

function updateRestFiles(): void {
  console.log(`\n📁 Aggiornamento file .rest in: ${REST_DIR}\n`);

  if (!fs.existsSync(REST_DIR)) {
    console.error(`  ❌ Cartella non trovata: ${REST_DIR}`);
    console.error(
      '     Verifica il path in REST_DIR o crea la cartella test/rest/',
    );
    return;
  }

  const files = fs.readdirSync(REST_DIR).filter((f) => f.endsWith('.rest'));

  if (files.length === 0) {
    console.warn('  ⚠️  Nessun file .rest trovato in', REST_DIR);
    return;
  }

  for (const file of files) {
    const filePath = path.join(REST_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const changes: string[] = [];

    for (const [placeholder, value] of Object.entries(ids)) {
      if (
        value &&
        value !== 'TODO_login_per_token' &&
        content.includes(placeholder)
      ) {
        content = content.replaceAll(placeholder, value);
        changes.push(placeholder);
      }
    }

    if (changes.length > 0) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`  ✅ ${file}  →  sostituiti: ${changes.join(', ')}`);
    } else {
      console.log(`  ➖ ${file}  (nessun placeholder trovato)`);
    }
  }
}

// ── Stampa riepilogo ─────────────────────────────────────────────────────────

function printSummary(): void {
  console.log('\n📋 Riepilogo valori raccolti:');
  console.log('─'.repeat(58));
  for (const [key, value] of Object.entries(ids)) {
    const display =
      value && value !== 'TODO_login_per_token'
        ? value
        : '⚠️  (non trovato — aggiornare manualmente)';
    console.log(`  ${key.padEnd(28)} ${display}`);
  }
  console.log('─'.repeat(58));
  console.log(
    '\n  ℹ️  Token JWT: da aggiornare manualmente fino a implementazione AuthModule.',
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🚀 sync-ids — Synapsis/SynapsisForge\n');
  console.log(
    `   DB:       ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`,
  );
  console.log(`   REST_DIR: ${REST_DIR}\n`);

  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    console.log('  ✅ Connesso al database\n');

    await collectIds(client);
    printSummary();
    updateRestFiles();

    console.log('\n✅ Fatto!\n');
  } catch (err) {
    console.error('\n❌ Errore:', (err as Error).message);
    console.error(
      '   Verifica che PostgreSQL sia in esecuzione e che DB_CONFIG sia corretto.',
    );
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
