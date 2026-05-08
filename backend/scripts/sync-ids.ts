// prettier-ignore
/* eslint-disable */
/**
 * sync-ids.ts
 * -----------
 * Aggiorna le variabili UUID nei file .rest interrogando PostgreSQL direttamente.
 *
 * Strategia: per ogni file .rest, sostituisce il VALORE delle righe
 * "@variabile = ..." con i dati freschi dal DB — indipendentemente dal
 * valore attuale (UUID vecchio, placeholder testuale, ecc.).
 *
 * Utilizzo:
 *   npm run sync-ids
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// ── Config ───────────────────────────────────────────────────────────────────

const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'admin',
  password: 'qwerty',
  database: 'pg_database',
};

const REST_DIR = path.resolve(process.cwd(), 'test', 'rest');
const STATE_FILE = path.resolve(process.cwd(), 'scripts', 'sync-ids.json');

// ── Tipi ─────────────────────────────────────────────────────────────────────

/**
 * Mappa: nome variabile REST (@adminId, @courseId, …) → valore nuovo.
 * I valori sono stringhe (UUID o slug).
 */
type RestVars = Record<string, string>;

// ── Raccolta valori dal DB ────────────────────────────────────────────────────

async function collectIds(client: Client): Promise<RestVars> {
  console.log('🔍 Raccolta valori dal database...\n');

  const vars: RestVars = {};

  // Users
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
    vars.adminId = admin.id;
    console.log(`  ✅ adminId:        ${admin.id}  (${admin.email})`);
  } else console.warn('  ⚠️  Nessun ADMIN nel DB');

  if (student) {
    vars.studentId = student.id;
    console.log(`  ✅ studentId:      ${student.id}  (${student.email})`);
  } else console.warn('  ⚠️  Nessuno STUDENT nel DB');

  if (instructor) {
    vars.instructorId = instructor.id;
    console.log(`  ✅ instructorId:   ${instructor.id}  (${instructor.email})`);
  } else console.warn('  ⚠️  Nessun INSTRUCTOR nel DB');

  // Corso
  const courseRes = await client.query<{
    id: string;
    slug: string;
    category_id: string;
  }>(
    `SELECT c.id, c.slug, c."categoryId" AS category_id
     FROM courses c
     WHERE c.status = 'PUBLISHED' AND c.deleted_at IS NULL
     ORDER BY c.created_at ASC LIMIT 1`,
  );
  if (courseRes.rows.length > 0) {
    const c = courseRes.rows[0];
    vars.courseId = c.id;
    vars.slug = c.slug ?? '';
    vars.categoryId = c.category_id ?? '';
    console.log(`  ✅ courseId:       ${c.id}`);
    console.log(`  ✅ slug:           ${c.slug}`);
    console.log(`  ✅ categoryId:     ${c.category_id}`);
  } else {
    console.warn('  ⚠️  Nessun corso PUBLISHED nel DB');
  }

  // Lezione (prima del corso trovato)
  if (vars.courseId) {
    const lessonRes = await client.query<{ id: string }>(
      `SELECT id FROM lessons WHERE "courseId" = $1 AND deleted_at IS NULL ORDER BY "order" ASC LIMIT 1`,
      [vars.courseId],
    );
    if (lessonRes.rows.length > 0) {
      vars.lessonId = lessonRes.rows[0].id;
      console.log(`  ✅ lessonId:       ${vars.lessonId}`);
    } else {
      console.warn('  ⚠️  Nessuna lezione trovata');
    }
  }

  // Enrollment
  const enrollRes = await client.query<{ id: string }>(
    `SELECT id FROM enrollments ORDER BY enrolled_at ASC LIMIT 1`,
  );
  if (enrollRes.rows.length > 0) {
    vars.enrollmentId = enrollRes.rows[0].id;
    console.log(`  ✅ enrollmentId:   ${vars.enrollmentId}`);
  } else {
    console.warn('  ⚠️  Nessun enrollment nel DB');
  }

  // Certificato
  const certRes = await client.query<{ id: string; certificate_code: string }>(
    `SELECT id, certificate_code FROM certificates LIMIT 1`,
  );
  if (certRes.rows.length > 0) {
    vars.certificateId = certRes.rows[0].id;
    vars.certificateCode = certRes.rows[0].certificate_code;
    console.log(`  ✅ certificateId:  ${vars.certificateId}`);
    console.log(`  ✅ certificateCode:${vars.certificateCode}`);
  } else {
    console.warn('  ⚠️  Nessun certificato nel DB');
  }

  // Review
  const reviewRes = await client.query<{ id: string }>(
    `SELECT id FROM reviews ORDER BY created_at ASC LIMIT 1`,
  );
  if (reviewRes.rows.length > 0) {
    vars.reviewId = reviewRes.rows[0].id;
    console.log(`  ✅ reviewId:       ${vars.reviewId}`);
  } else {
    console.warn('  ⚠️  Nessuna review nel DB');
  }

  return vars;
}

// ── Aggiornamento file .rest ──────────────────────────────────────────────────

/**
 * Per ogni riga che inizia con "@nomeVar" (con spazi opzionali prima di "="),
 * sostituisce il valore dopo "=" con il nuovo valore da DB.
 *
 * Esempio:
 *   @courseId       = 4215d6de-99ee-4d84-8115-decf48ab3e7a
 *   →
 *   @courseId       = a59099c7-2956-4d13-b28a-618144d6e64c
 *
 * Il padding di spazi tra il nome e "=" viene preservato.
 */
function applyVarsToFile(
  content: string,
  vars: RestVars,
): { updated: string; changed: string[] } {
  const changed: string[] = [];

  const updated = content.replace(
    /^(@\w+)(\s*=\s*)(.+)$/gm,
    (match, varDecl: string, eq: string, oldValue: string) => {
      // varDecl è "@courseId", varName è "courseId"
      const varName = varDecl.slice(1);
      const newValue = vars[varName];

      // Aggiorna solo se abbiamo un valore dal DB e il valore è cambiato
      if (newValue !== undefined && newValue !== oldValue.trim()) {
        changed.push(varName);
        return `${varDecl}${eq}${newValue}`;
      }
      return match;
    },
  );

  return { updated, changed };
}

function updateRestFiles(vars: RestVars): void {
  console.log(`\n📁 Aggiornamento file .rest in: ${REST_DIR}\n`);

  if (!fs.existsSync(REST_DIR)) {
    console.error(`  ❌ Cartella non trovata: ${REST_DIR}`);
    return;
  }

  const files = fs.readdirSync(REST_DIR).filter((f) => f.endsWith('.rest'));
  if (files.length === 0) {
    console.warn('  ⚠️  Nessun file .rest trovato');
    return;
  }

  for (const file of files) {
    const filePath = path.join(REST_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { updated, changed } = applyVarsToFile(content, vars);

    if (changed.length > 0) {
      fs.writeFileSync(filePath, updated, 'utf-8');
      console.log(`  ✅ ${file}  →  aggiornati: ${changed.join(', ')}`);
    } else {
      console.log(`  ➖ ${file}  (già aggiornato)`);
    }
  }
}

// ── Stato (solo per riferimento, non più usato per la logica di replace) ──────

function saveState(vars: RestVars): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(vars, null, 2), 'utf-8');
  console.log(`\n  💾 Stato salvato in: ${STATE_FILE}`);
}

// ── Stampa riepilogo ──────────────────────────────────────────────────────────

function printSummary(vars: RestVars): void {
  console.log('\n📋 Riepilogo valori raccolti:');
  console.log('─'.repeat(62));
  for (const [key, value] of Object.entries(vars)) {
    console.log(`  ${key.padEnd(20)} ${value}`);
  }
  console.log('─'.repeat(62));
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

    const vars = await collectIds(client);
    printSummary(vars);
    updateRestFiles(vars);
    saveState(vars);

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
