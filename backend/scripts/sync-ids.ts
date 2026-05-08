/**
 * sync-ids.ts
 * -----------
 * Aggiorna le variabili UUID nei file .rest dopo un reset del database.
 *
 * Utilizzo:
 *   npx ts-node scripts/sync-ids.ts
 *   oppure (dopo aver aggiunto a package.json):
 *   npm run sync-ids
 *
 * Prerequisiti in package.json:
 *   "scripts": {
 *     "sync-ids": "ts-node scripts/sync-ids.ts"
 *   }
 *   "devDependencies": {
 *     "ts-node": "^10.x",
 *     "typescript": "^5.x"
 *   }
 *
 * Lo script:
 * 1. Chiama GET /admin/users per raccogliere userId per ruolo
 * 2. Chiama GET /courses per prendere il primo courseId e slug
 * 3. Chiama GET /courses/:id per prendere categoryId e instructorId
 * 4. Sostituisce i placeholder nei file .rest con i valori reali
 *
 * NOTA AUTH: quando il modulo Auth sarà disponibile, decommentare
 * la sezione "Login" per ottenere i token JWT automaticamente.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000';

// Cartella contenente i file .rest (relativa a process.cwd())
const REST_DIR = path.resolve(process.cwd(), 'test/rest');

// Mappa placeholder → valore reale che verrà popolata dallo script
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
  // Token — compilati manualmente o dalla sezione Login (sotto)
  ADMIN_JWT_TOKEN: 'TODO_login_per_token',
  STUDENT_JWT_TOKEN: 'TODO_login_per_token',
  INSTRUCTOR_JWT_TOKEN: 'TODO_login_per_token',
};

// ── Helper fetch ─────────────────────────────────────────────────────────────

async function get<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${path} → ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Raccolta dati ────────────────────────────────────────────────────────────

async function collectIds(): Promise<void> {
  console.log('🔍 Raccolta UUID dal database...\n');

  // ── [1] Utenti per ruolo ────────────────────────────────────────────
  // TODO: quando AuthModule è pronto, fare login qui e usare adminToken
  // const loginRes = await fetch(`${BASE_URL}/auth/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email: 'admin@example.com', password: 'password' }),
  // });
  // const { access_token } = await loginRes.json();
  // ids.ADMIN_JWT_TOKEN = access_token;

  try {
    const users =
      await get<Array<{ id: string; role: string }>>('/admin/users');

    const admin = users.find((u) => u.role === 'ADMIN');
    const student = users.find((u) => u.role === 'STUDENT');
    const instructor = users.find((u) => u.role === 'INSTRUCTOR');

    if (admin) {
      ids.ADMIN_UUID = admin.id;
      console.log(`  ✅ adminId: ${admin.id}`);
    } else {
      console.warn('  ⚠️  Nessun ADMIN trovato nel DB');
    }

    if (student) {
      ids.STUDENT_UUID = student.id;
      console.log(`  ✅ studentId: ${student.id}`);
    } else {
      console.warn('  ⚠️  Nessuno STUDENT trovato nel DB');
    }

    if (instructor) {
      ids.INSTRUCTOR_UUID = instructor.id;
      console.log(`  ✅ instructorId: ${instructor.id}`);
    } else {
      console.warn('  ⚠️  Nessun INSTRUCTOR trovato nel DB');
    }
  } catch (err) {
    console.error('  ❌ Errore GET /admin/users:', (err as Error).message);
    console.error(
      '     (se il guard è attivo, configura il token in ids prima di proseguire)',
    );
  }

  // ── [2] Primo corso disponibile ─────────────────────────────────────
  try {
    const coursesRes = await get<{ data: Array<{ id: string; slug: string }> }>(
      '/courses?page=1&limit=1',
    );

    const first = coursesRes.data?.[0];
    if (first) {
      ids.COURSE_UUID = first.id;
      ids.SLUG_VALUE = first.slug ?? '';
      console.log(`  ✅ courseId: ${first.id}`);
      console.log(`  ✅ slug: ${first.slug}`);

      // ── [3] Dettaglio corso per categoryId ──────────────────────────
      try {
        const course = await get<{
          id: string;
          category?: { id: string };
          instructor?: { userId: string };
        }>(`/courses/${first.id}`);

        if (course.category?.id) {
          ids.CATEGORY_UUID = course.category.id;
          console.log(`  ✅ categoryId: ${course.category.id}`);
        }
        // instructorId già recuperato dagli utenti, ma prendiamo anche da qui come fallback
        if (course.instructor?.userId && !ids.INSTRUCTOR_UUID) {
          ids.INSTRUCTOR_UUID = course.instructor.userId;
          console.log(
            `  ✅ instructorId (da corso): ${course.instructor.userId}`,
          );
        }
      } catch (err) {
        console.error(
          `  ❌ Errore GET /courses/${first.id}:`,
          (err as Error).message,
        );
      }

      // ── [4] Prima lezione del corso ──────────────────────────────────
      try {
        const courseWithLessons = await get<{
          lessons?: Array<{ id: string }>;
        }>(`/courses/${first.id}`);

        const firstLesson = courseWithLessons.lessons?.[0];
        if (firstLesson) {
          ids.LESSON_UUID = firstLesson.id;
          console.log(`  ✅ lessonId: ${firstLesson.id}`);
        } else {
          console.warn('  ⚠️  Nessuna lezione trovata per il primo corso');
        }
      } catch (err) {
        console.error('  ❌ Errore recupero lezioni:', (err as Error).message);
      }
    } else {
      console.warn('  ⚠️  Nessun corso trovato nel DB');
    }
  } catch (err) {
    console.error('  ❌ Errore GET /courses:', (err as Error).message);
  }

  // ── [5] Primo enrollment ────────────────────────────────────────────
  // TODO: aggiungere endpoint GET /enrollments (se esposto) o query diretta
  // Per ora: placeholder — aggiornare manualmente o estendere quando l'endpoint esiste
  console.log(
    '  ℹ️  enrollmentId: da aggiornare manualmente (endpoint GET /enrollments non esposto)',
  );

  // ── [6] Primo certificato ───────────────────────────────────────────
  // TODO: stessa situazione di enrollment
  console.log('  ℹ️  certificateId/Code: da aggiornare manualmente');

  // ── [7] Prima review ────────────────────────────────────────────────
  // TODO: stessa situazione
  console.log('  ℹ️  reviewId: da aggiornare manualmente\n');
}

// ── Aggiornamento file .rest ─────────────────────────────────────────────────

function updateRestFiles(): void {
  console.log(`📁 Aggiornamento file .rest in: ${REST_DIR}\n`);

  const files = fs.readdirSync(REST_DIR).filter((f) => f.endsWith('.rest'));

  if (files.length === 0) {
    console.warn('  ⚠️  Nessun file .rest trovato in', REST_DIR);
    return;
  }

  for (const file of files) {
    const filePath = path.join(REST_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    for (const [placeholder, value] of Object.entries(ids)) {
      if (
        value &&
        value !== 'TODO_login_per_token' &&
        content.includes(placeholder)
      ) {
        content = content.replaceAll(placeholder, value);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`  ✅ Aggiornato: ${file}`);
    } else {
      console.log(`  ➖ Nessuna modifica: ${file}`);
    }
  }
}

// ── Stampa riepilogo ─────────────────────────────────────────────────────────

function printSummary(): void {
  console.log('\n📋 Riepilogo valori raccolti:');
  console.log('─'.repeat(50));
  for (const [key, value] of Object.entries(ids)) {
    const display = value || '(non trovato — aggiornare manualmente)';
    console.log(`  ${key.padEnd(28)} = ${display}`);
  }
  console.log('─'.repeat(50));
  console.log(
    '\nℹ️  Per token JWT: implementare sezione Login quando AuthModule è pronto.',
  );
  console.log(
    'ℹ️  Per enrollmentId/certificateId/reviewId: aggiornare manualmente dopo seed.\n',
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🚀 sync-ids — Synapsis/SynapsisForge\n');
  console.log(`   BASE_URL: ${BASE_URL}`);
  console.log(`   REST_DIR: ${REST_DIR}\n`);

  await collectIds();
  printSummary();
  updateRestFiles();

  console.log('✅ Fatto!\n');
}

main().catch((err) => {
  console.error('❌ Errore fatale:', err);
  process.exit(1);
});
