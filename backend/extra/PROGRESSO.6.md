# SynapsisForge — Handoff Document
## Sessione: fix lesson-player (404 video) + pulizia env seed/reset

---

## Stato attuale ✅

| Cosa | Stato |
|---|---|
| Bug — 404 su `GET /enrollments/:id/lessons/:id/video` | ✅ risolto |
| Causa | `data-source.ts`/seed Postgres erano ok, ma `lesson_content` su MongoDB non era mai stato (ri)popolato dopo un reset parziale — il seed Postgres falliva su `categories` e l'intero `seed.ts` si interrompeva prima di arrivare alla sezione MongoDB |
| Fix applicato | Rieseguito `npm run db:seed:mongo` per risincronizzare Mongo con gli UUID lezione realmente presenti in Postgres |
| Refactor — hardcoded values negli script di seed/reset | ✅ completato |
| Creato `src/database/shared/mongo-uri.util.ts` | ✅ — unica funzione `getMongoUri()` che legge `MONGO_URI` + `MONGO_USER`/`MONGO_PASS`/`MONGO_AUTH_SOURCE` da `.env` |
| `src/database/seeds/mongo.seed.ts` | ✅ — rimosso `synapsis` hardcoded, ora usa `getMongoUri()` |
| `src/database/seeds/reset.ts` | ✅ — rimosso `MONGO_DB ?? 'mnongo_database'` (env inesistente + typo storico), ora usa `getMongoUri()` |
| `src/database/scripts/sync-ids.ts` | ✅ — rimosso `DB_CONFIG` hardcoded (host/user/pass/db), ora legge da `.env` con `requireEnv()` fail-fast |
| Bug — `sync-ids.ts` ENOENT su `sync-ids.json` | ✅ risolto |
| Causa | `STATE_FILE` era costruito con `path.resolve(process.cwd(), 'scripts', 'sync-ids.json')` → puntava a `backend/scripts/`, cartella orfana dopo lo spostamento dello script in `src/database/scripts/` |
| Fix applicato | `STATE_FILE` ora usa `path.resolve(__dirname, 'sync-ids.json')` — il file di stato vive sempre accanto allo script, indipendente dal cwd |
| Task — corso gratuito per test player | ✅ applicato |
| Fix | In `src/database/seeds/courses.seed.ts`, riga del corso *"React & TypeScript from Scratch"*: `price: 44.99` → `price: 0`. Ora è deterministico ad ogni `db:reset && db:seed`, niente più UPDATE manuale via SQL che si perdeva ad ogni reset |

---

## 🔧 DA VERIFICARE nella prossima sessione

### Player video — buffering/freeze

Il player si apre correttamente (niente più 404), ma il video "frulla"/non parte fluido. Sospetto principale: connessione internet locale instabile (download in background lato utente), **non confermato come bug applicativo**.

**Da testare appena la rete è libera:**
1. Riprovare la lezione con rete pulita (nessun download in background)
2. Se persiste: controllare in Network tab se la richiesta al video (`BigBuckBunny.mp4` o simili, da Google Cloud Storage — vedi `TEST_VIDEOS` in `mongo.seed.ts`) ha tempi di risposta anomali o viene interrotta
3. Se persiste anche con rete pulita: verificare se è specifico di un browser, o se il tag `<video>` in Angular ha problemi di re-render quando `signal()`/`computed()` cambiano referenza (causa comune di "flickering" in Angular con signal su elementi media)

Se confermato bug applicativo, prossima sessione si apre un'indagine dedicata.

---

## File coinvolti in questa sessione

| File | Modifica |
|---|---|
| `src/database/shared/mongo-uri.util.ts` | **nuovo** — helper `getMongoUri()` |
| `src/database/seeds/mongo.seed.ts` | URI Mongo ora da `getMongoUri()`, no più hardcoded |
| `src/database/seeds/reset.ts` | URI Mongo ora da `getMongoUri()`, no più `MONGO_DB`/typo |
| `src/database/scripts/sync-ids.ts` | `DB_CONFIG` ora da `.env` con `requireEnv()`; `STATE_FILE` ora da `__dirname` |
| `src/database/seeds/courses.seed.ts` | Corso "React & TypeScript from Scratch" → `price: 0` |

---

## Dati di riferimento (validi dopo l'ultimo seed — verificare con `npm run sync-ids` se più vecchi di qualche giorno)

| Cosa | Valore |
|---|---|
| admin email | `admin@example.com` |
| alice (student) email | `alice@example.com` / `Password123!` |
| corso gratuito (React & TS) courseId | `2ddd7354-ecf0-4921-8770-d5384914fb7b` |
| corso slug | `react-typescript-from-scratch` |

⚠️ Questi UUID cambiano ad ogni `npm run db:reset && npm run db:seed` (sono generati da Postgres). Usa `npm run sync-ids` per rigenerare i riferimenti freschi nei file `.rest` e per ottenere i valori aggiornati a console.

---

## Note tecniche persistenti

- `USE_S3=false` in `.env` → `getVideoUrl()` usa `content.videoUrl` diretto (video pubblici di test da Google Cloud Storage, lista in `TEST_VIDEOS` dentro `mongo.seed.ts`)
- `connectionName` MongoDB: `mongo_synapsis` — deve essere identico ovunque (ora garantito dall'helper `getMongoUri()`, che legge `MONGO_URI=mongodb://localhost:27017/mongo_synapsis` da `.env`)
- Database Mongo reale: `mongo_synapsis` — collezione `lesson_content`
- Ordine di esecuzione seed: Postgres prima (categories → users → courses → sections/lessons → enrollments), poi MongoDB riceve i lessonId reali da Postgres — se il seed Postgres fallisce a metà, **Mongo non viene mai popolato/aggiornato** in quella run (vale per `seed.ts`, non per `seed-mongo-only.ts` che è standalone)
- Comando per risincronizzare solo Mongo senza toccare Postgres: `npm run db:seed:mongo`
- `jwt.strategy.ts` → `validate()` ritorna l'entity `User` intera → `req.user.id` (non `req.user.sub`)
- Tailwind v4 token semantici: `bg-surface`, `bg-surface-alt`, `text-heading`, `text-fg`, `text-fg-muted`, `text-fg-brand`
- Angular: `inject()`, `@if`/`@for`, `signal()`, `computed()`
- GitLab remote: `gitlab.com/superporz1/SynapsisForge.git`
- Pattern di iniezione cross-modulo: ogni modulo registra direttamente le entità/schemi di cui ha bisogno nel proprio `forFeature` (sia TypeORM che Mongoose), invece di esportare i moduli interi
- `LessonContent` schema (Mongo) ha già `quiz: [{ question, options: [{label, text}], correctAnswer }]` popolato dal seed — un solo oggetto quiz per lezione, ciclato per categoria (vedi `QUIZZES` in `mongo.seed.ts`). Utile per la prossima feature (quiz interattivo)

---

## 🎯 Prossime task — Quiz interattivo nel player

Requisiti raccolti per la prossima sessione:

1. **Componente Quiz** (Angular)
   - Mostra le domande una alla volta, con animazione di transizione tra una domanda e la successiva
   - Dato già disponibile in `LessonContent.quiz` (array di domande, anche se al momento il seed ne genera solo una per lezione — valutare se estendere il seed a più domande per lezione, o se il componente deve gestire comunque un array di lunghezza variabile incluso 1)

2. **Feedback immediato**
   - Risposta corretta → evidenziazione verde + testo di spiegazione
   - Risposta sbagliata → evidenziazione rossa + mostra la risposta corretta
   - Nota: il seed attuale (`QUIZZES` in `mongo.seed.ts`) non ha un campo `explanation` — da aggiungere allo schema Mongo (`lesson-content.schema.ts`) e ai dati seed se si vuole la spiegazione testuale, oppure generarla lato frontend solo mostrando "Risposta corretta: X"

3. **Salvataggio completamento quiz**
   - Via `POST /enrollments/:id/progress` (verificare nome esatto route — nel backend attuale la route è `PATCH /enrollments/:enrollmentId/lessons/:lessonId/progress`, gestita da `LessonPlayerController.updateProgress()` → `LessonsService.updateLessonProgress()`. Da chiarire se si intende riusare questa route passando `completed: true` quando il quiz è superato, o se serve un endpoint dedicato)

4. **Modale di congratulazioni a fine corso**
   - Al completamento dell'ultima lezione, mostrare un modale con link al certificato
   - Backend già emette logica di completamento corso in `EnrollmentsService` (menzionato in `lesson-player.controller.ts`: *"Se tutte le lezioni sono completate, EnrollmentsService emette enrollment.completed e aggiorna progress_percent"*) — da verificare se esiste già un evento/hook recuperabile lato frontend, o se va aggiunto un check esplicito dopo ogni `updateProgress()` (es. leggere `completedLessonIds.length === sections.flatMap(lessons).length` dalla response di `getVideoUrl()`)
   - Certificato: verificare se esiste già un endpoint `GET /certificates/:enrollmentId` o simile per ottenere l'URL/PDF da linkare nel modale

**Da chiarire in apertura della prossima sessione**, prima di scrivere codice:
- Schema esatto di `LessonContent.quiz` in Mongo (campi disponibili: `question`, `options[]`, `correctAnswer` — manca `explanation`?)
- Route reale per salvare completamento quiz (riuso di `updateProgress` o nuovo endpoint?)
- Esistenza/path dell'endpoint certificato per il modale finale

---

## Commit suggerito (sessione corrente)

```
fix(seed): fix lesson-player 404 and remove hardcoded values from seed/reset scripts

- Resync MongoDB lesson_content via db:seed:mongo (was stale after a
  partial Postgres reset that failed before reaching the Mongo seed step)
- Add src/database/shared/mongo-uri.util.ts: single source of truth for
  building the Mongo connection URI from .env (MONGO_URI + credentials)
- mongo.seed.ts: remove hardcoded "synapsis" database name, use getMongoUri()
- reset.ts: remove non-existent MONGO_DB env lookup and legacy typo fallback
  ("mnongo_database"), use getMongoUri()
- sync-ids.ts: remove hardcoded Postgres DB_CONFIG, read from .env with
  fail-fast requireEnv(); fix STATE_FILE path (__dirname instead of cwd-relative,
  which broke after script relocation to src/database/scripts/)
- courses.seed.ts: set "React & TypeScript from Scratch" price to 0 so the
  free-course test flow survives db:reset + db:seed deterministically

TODO next session: verify video player buffering/freeze (likely local network
issue, not yet confirmed as app bug); then implement interactive quiz component
in lesson player (see requirements below)
```