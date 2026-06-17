# SynapsisForge — Handoff Document
## Sessione: lesson-player debug (LessonsModule DI chain → MongoDB auth → seed)

---

## Stato attuale ✅

| Cosa | Stato |
|---|---|
| Bug 1 — `LessonProgressModel` non risolto in `LessonsModule` | ✅ risolto |
| Fix: aggiunto `LessonProgress` al `MongooseModule.forFeature` di `lessons.module.ts` | ✅ applicato |
| Bug 2 — `EnrollmentRepository` non risolto in `LessonsModule` | ✅ risolto |
| Causa: `LessonsService` inietta `EnrollmentRepository` (TypeORM) ma `EnrollmentsModule` non lo esporta | ✅ identificato |
| Fix: aggiunto `Enrollment` al `TypeOrmModule.forFeature` di `lessons.module.ts` | ✅ applicato |
| Bug 3 — `MongoServerError: Command find requires authentication` | ✅ risolto |
| Causa: `MongooseModule.forRoot` in `AppModule` usava una URI hardcoded senza credenziali, ignorando `MONGO_USER`/`MONGO_PASS` dell'`.env` | ✅ identificato |
| Fix: migrato a `MongooseModule.forRootAsync` con `useFactory` + `ConfigService`, leggendo `MONGO_URI`, `MONGO_USER`, `MONGO_PASS`, `MONGO_AUTH_SOURCE` | ✅ applicato |
| Bug 4 — seed Mongo creava un database con typo (`mnongo_database`) | ✅ risolto |
| Causa: `mongo.seed.ts` costruiva la URI a mano con fallback hardcoded errato, ignorando le env vars reali | ✅ identificato |
| Fix: allineata la URI del seed alle stesse variabili usate dall'app (database `synapsis`) | ✅ applicato |

---

## 🔧 APERTO — Seed PostgreSQL: `relation "categories" does not exist`

### Errore

```
QueryFailedError: relation "categories" does not exist
  at seedCategories (categories.seed.ts:48:17)
  at main (seed.ts:39:24)
code: '42P01'
```

### Causa identificata

Il `data-source.ts` usato dallo script di seed standalone ha:
```typescript
synchronize: false,
migrations: ['src/database/migrations/*.ts'],
```

Quindi **non crea automaticamente le tabelle**. Il seed presuppone che lo schema esista già, ma il database Postgres è vuoto (nessuna tabella creata).

### Da verificare nella prossima sessione

Capire qual è la situazione reale del progetto:

1. **Se esiste un secondo DataSource per NestJS** (es. in `app.module.ts` via `TypeOrmModule.forRootAsync`) con `synchronize: true` → soluzione: avviare il backend NestJS una volta (`npm run start:dev`) per far sincronizzare lo schema, poi fermarlo e lanciare `npm run db:seed`.

2. **Se `data-source.ts` è l'unico punto di configurazione DB** del progetto → serve decidere tra:
   - Settare temporaneamente `synchronize: true` in `data-source.ts` per generare lo schema, poi seedare
   - Oppure generare/eseguire migration TypeORM (`npm run migration:generate` + `npm run migration:run`) se si vuole restare fedeli all'approccio a migration dichiarato nel file

**TODO prossima sessione**: chiarire questo punto e applicare il fix scelto, poi ri-eseguire `npm run db:seed` e verificare che completi senza errori (Categories → Users → Courses → Sections/Lessons → Enrollments → Mongo).

---

## File coinvolti in questa sessione

| File | Modifica |
|---|---|
| `src/modules/lessons/lessons.module.ts` | Aggiunto `LessonProgress` a `MongooseModule.forFeature`; aggiunto `Enrollment` a `TypeOrmModule.forFeature` |
| `src/app.module.ts` (o dove registrato `MongooseModule.forRoot`) | Migrato a `forRootAsync` con `ConfigService` per leggere credenziali da `.env` |
| `src/database/seeds/mongo.seed.ts` | Corretta costruzione URI (rimosso fallback con typo `mnongo_database`, allineato a database `synapsis`) |
| `src/database/seeds/seed.ts` | Nessuna modifica — bloccato dall'assenza dello schema Postgres |
| `src/data-source.ts` | Da verificare/modificare nella prossima sessione (`synchronize: false` + migrations vuote) |

---

## Architettura route lesson-player (invariata, per riferimento)

Angular chiama:
- `GET /enrollments/:enrollmentId/lessons/:lessonId/video` → `LessonPlayerController.getVideoUrl()`
- `PATCH /enrollments/:enrollmentId/lessons/:lessonId/progress` → `LessonPlayerController.updateProgress()`

`LessonPlayerController` è in `src/modules/lessons/lesson-player.controller.ts`, registrato in `LessonsModule`.

`getVideoUrl()` verifica l'enrollment via `EnrollmentsService.findById()` prima di generare l'URL.

---

## Dati di riferimento

| Cosa | Valore |
|---|---|
| alice email | `alice@example.com` |
| alice userId | `88b7d0e3-58f2-4e2f-b65d-8432bb7f047c` |
| corso ML (gratuito) courseId | `01b236bc-7456-4380-80bc-0c47fd7566bf` |
| enrollment alice→ML | `c983112e-e6c0-4338-830c-653009d712a5` |
| lessonId testato | `1464c78c-4ec8-4546-a1c1-b7c2ee56eeb0` |
| Corso modificato a price=0 via SQL | `34503a36-6c4b-4ac7-85b9-d18c2793e6d8` |

---

## Note tecniche persistenti

- `USE_S3=false` in `.env` → `getVideoUrl()` usa `content.videoUrl` diretto (no signed URL)
- `connectionName` MongoDB: `mongo_synapsis` — deve essere identico ovunque
- Database Mongo reale: `synapsis` — collezione `lesson_content`
- `jwt.strategy.ts` → `validate()` ritorna l'entity `User` intera → `req.user.id` (non `req.user.sub`)
- Tailwind v4 token semantici: `bg-surface`, `bg-surface-alt`, `text-heading`, `text-fg`, `text-fg-muted`, `text-fg-brand`
- Angular: `inject()`, `@if`/`@for`, `signal()`, `computed()`
- GitLab remote: `gitlab.com/superporz1/SynapsisForge.git`
- Pattern di iniezione cross-modulo in questo progetto: ogni modulo registra direttamente le entità/schemi di cui ha bisogno nel proprio `forFeature` (sia TypeORM che Mongoose), invece di esportare i moduli interi — scelta consapevole per evitare di esporre più del necessario

---

## Commit suggerito (sessione corrente)

```
fix(lessons): resolve full DI chain and MongoDB auth for lesson-player

- Add LessonProgress to LessonsModule MongooseModule.forFeature
- Add Enrollment to LessonsModule TypeOrmModule.forFeature
- Migrate MongooseModule.forRoot to forRootAsync with ConfigService
  to properly read MONGO_USER/MONGO_PASS from .env
- Fix mongo.seed.ts URI construction (remove hardcoded typo fallback,
  align to real database name "synapsis")

TODO: resolve Postgres seed failure (relation "categories" does not exist)
  — data-source.ts has synchronize: false with no migrations applied;
  decide between running NestJS once to sync schema, or generating
  proper migrations, before re-running npm run db:seed
```