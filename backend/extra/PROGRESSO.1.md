# SynapsisForge — Handoff document
## Sessione: seed refactor + lesson-player fixes

---

## Stato progetto

**Stack:** Angular 21 (standalone, Signals, RxJS) + Tailwind v4 — frontend. NestJS + TypeScript + PostgreSQL (TypeORM) + MongoDB (Mongoose) — backend.

---

## Cosa è stato fatto in questa sessione ✅

| Cosa | Stato |
|---|---|
| Bug `navigateToLesson()` — `route.snapshot` → `route.paramMap.subscribe()` | ✅ fatto |
| `lessonId` e `enrollmentId` convertiti da `string` a `signal<string>` in `LessonPlayer` | ✅ fatto |
| `activeLessonId = computed(() => this.lessonId())` aggiornato | ✅ fatto |
| `timeupdateSub?.unsubscribe()` aggiunto all'inizio di `loadLesson()` | ✅ fatto |
| Flag `USE_S3=false` aggiunto in `.env` | ✅ fatto |
| `getVideoUrl()` biforcato: se `USE_S3=false` restituisce `content.videoUrl` direttamente | ✅ fatto |
| Nome variabile `AWS_S3_BUCKET` → `AWS_S3_BUCKET_NAME` allineato tra `.env` e service | ✅ fatto |
| Seed system completamente riscritto — 8 file modulari | ✅ fatto |
| `reset.ts` — TRUNCATE PG + drop Mongo collections | ✅ fatto |
| `seed.ts` — orchestratore unico con passaggio UUID reali PG → Mongo | ✅ fatto |
| `categories.seed.ts` — 6 categorie | ✅ fatto |
| `users.seed.ts` — 1 admin, 4 instructor (1 unverified), 10 student (2 unverified) | ✅ fatto |
| `courses.seed.ts` — 30 PUBLISHED, 3 PENDING, 2 DRAFT su 6 categorie | ✅ fatto |
| `sections.seed.ts` — 3 sezioni + 8 lezioni per corso PUBLISHED (240 lezioni totali) | ✅ fatto |
| `enrollments.seed.ts` — enrollment + payment + review (solo completed) + certificate | ✅ fatto |
| `mongo.seed.ts` — LessonContent con UUID reali da PG, video pubblici funzionanti | ✅ fatto |

---

## ⚠️ PUNTO DI RIPRESA — DA FARE PRIMA DI TUTTO

### Verificare esito `db:reset` e `db:seed`

La sessione si è chiusa **prima che i comandi venissero lanciati**. La prossima sessione inizia da qui.

**Step 1 — lancia reset:**
```bash
npm run db:reset
```
Output atteso:
```
🗑️  Resetting databases...
  ✅ PostgreSQL: all tables truncated
  ✅ MongoDB: dropped collection "lesson_contents"
  ✅ MongoDB: dropped collection "lesson_progress"
✅ Reset complete. Run "npm run db:seed" to repopulate.
```

**Step 2 — se reset ok, lancia seed:**
```bash
npm run db:seed
```
Output atteso finale:
```
🎉 Seed complete!
  Admin:       admin@example.com
  Instructor:  james.carter@synapsis.dev
  ...
```

**Errori probabili da investigare:**

1. **Colonne FK sbagliate** — il seed usa relazioni TypeORM (`instructor`, `category`, `student`, `course`). Se TypeORM si lamenta di colonne mancanti, verificare i nomi esatti nelle entity (es. `instructorUserId` vs `userId` in `InstructorProfile`).

2. **`sections.seed.ts` — `course.category` undefined** — il seed ricarica i corsi con `relations: ['category']` in `seed.ts` prima di passarli a `seedSections()`. Se `categorySlug` risulta undefined, il fallback è `'web-development'`.

3. **MongoDB URI** — `mongo.seed.ts` usa `process.env.MONGO_DB`. Verificare che la variabile esista nel `.env` oppure che il fallback `'mnongo_database'` corrisponda al nome reale del database (nel `.env` attuale l'URI è hardcoded come `mongodb://localhost:27017/mnongo_database`).

4. **`Certificate` entity** — `enrollments.seed.ts` importa `Certificate` da `../../common/entities/certificates.entity`. Verificare che il path sia corretto nel progetto.

5. **`Review` entity** — stessa cosa: `../../common/entities/reviews.entity` e campo `rating` come enum o number.

---

## Struttura seed finale

```
src/database/seeds/
├── seed.ts              ← npm run db:seed
├── reset.ts             ← npm run db:reset
├── categories.seed.ts
├── users.seed.ts
├── courses.seed.ts
├── sections.seed.ts
├── enrollments.seed.ts
└── mongo.seed.ts
```

Script in `package.json` da aggiungere se non presenti:
```json
"db:seed":  "ts-node src/database/seeds/seed.ts",
"db:reset": "ts-node src/database/seeds/reset.ts"
```

---

## Dati seed — riepilogo

| Entità | Quantità | Note |
|---|---|---|
| Categories | 6 | Web Dev, Data Science, UI/UX, Mobile, DevOps, Cybersecurity |
| Users | 15 | 1 admin, 4 instructor (1 unverified), 10 student (2 unverified) |
| Courses | 35 | 30 PUBLISHED, 3 PENDING, 2 DRAFT |
| Sections | 90 | 3 per corso PUBLISHED |
| Lessons (PG) | 240 | 8 per corso PUBLISHED |
| LessonContents (Mongo) | 240 | UUID reali da PG, video pubblici GTVSample |
| Enrollments | ~32 | 8 studenti × 3-5 corsi ciascuno |
| Certificates | ~8 | 1 per studente (enrollment al 100%) |
| Reviews | ~8 | Solo su enrollment completati |
| Payments | ~32 | 1 per enrollment |

**Credenziali (password uguale per tutti: `Password123!`):**
- Admin: `admin@example.com`
- Instructor verificato: `james.carter@synapsis.dev`, `sofia.esposito@synapsis.dev`, `marco.weber@synapsis.dev`
- Instructor non verificato: `claire.dupont@synapsis.dev`
- Student verificato: `alice@example.com`, `bob@example.com`, `chiara@example.com`, `john@example.com`, `priya@example.com`, `luca@example.com`, `emma@example.com`, `carlos@example.com`
- Student non verificato: `unverified1@example.com`, `unverified2@example.com`

---

## Prossimi step — in ordine

### 1. ✅ Verificare reset + seed (vedi sopra)

### 2. Test end-to-end `LessonPlayer`
Solo dopo che il seed è andato a buon fine:
- Recupera un `enrollmentId` e un `lessonId` reali con `npm run sync-ids`
- Naviga a `/enrollments/:enrollmentId/lessons/:lessonId`
- Verificare:
  - [ ] Video si carica (URL da MongoDB, non S3)
  - [ ] Seek alla posizione salvata (`last_position_seconds`)
  - [ ] `timeupdate` salva ogni 10s (Network tab)
  - [ ] Evento `ended` → lezione marcata completata (✅ sidebar)
  - [ ] `navigateToLesson()` cambia lezione senza ricaricare la pagina
  - [ ] `activeLessonId` si aggiorna immediatamente al click sidebar

### 3. Collegare `course-detail` → `lesson-player`
- Verificare che `course-detail` mostri sezioni e lezioni
- Ogni lezione deve avere un link/bottone che naviga a `/enrollments/:enrollmentId/lessons/:lessonId`
- `enrollmentId` da recuperare: valutare se aggiungere `GET /enrollments/my?courseId=:id` oppure includerlo nella response del corso per utenti iscritti
- Se utente non iscritto → CTA "Enroll in this course"

### 4. Backlog `course-list` (post-player)
- `WHERE status = 'PUBLISHED'` mancante nel `GET /courses` backend
- Filtro categoria multi-select (`string | null` → `string[]`)
- Cursore pointer mancante sui bottoni paginazione
- Contatore `total()` non aggiornato durante ricerca testuale
- Filtro livello — UI presente ma non collegata, backend non ha campo `level`

---

## Architettura database — mappa completa

### PostgreSQL (TypeORM)

#### `users`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| email | varchar unique nullable | null per OAuth |
| password | varchar nullable | null per OAuth |
| first_name | varchar | |
| last_name | varchar | |
| birth_date | date nullable | |
| country | enum(Country) nullable | |
| role | enum(UserRole) | STUDENT / INSTRUCTOR / ADMIN |
| is_active | boolean | default true |
| isVerified | boolean | default false |
| refresh_token_hash | varchar nullable | |
| email_verification_token | uuid nullable | |
| password_reset_token | uuid nullable | |
| password_reset_expires_at | timestamptz nullable | |
| createdAt | timestamp | auto |

#### `instructor_profiles`
| Campo | Tipo | Note |
|---|---|---|
| userId | uuid PK FK→users | anche JoinColumn |

#### `student_profiles`
| Campo | Tipo | Note |
|---|---|---|
| userId | uuid PK FK→users | anche JoinColumn |

#### `categories`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| name | varchar unique | |
| slug | varchar unique nullable | |
| description | varchar | |

#### `courses`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| title | varchar unique | |
| slug | varchar unique nullable | |
| description | varchar | |
| price | decimal(10,2) | |
| status | enum(Status) | DRAFT / PENDING / PUBLISHED / REJECTED |
| thumbnail_url | varchar | |
| featured | boolean | default false |
| created_at | timestamp | auto |
| deleted_at | timestamp nullable | soft delete |

#### `sections`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| title | varchar(255) | |
| order | int | |

Relazioni: `ManyToOne → courses (CASCADE)`, `OneToMany → lessons`

#### `lessons`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| title | varchar | |
| order | int | |
| duration_seconds | int | |
| content_id | varchar | riferimento a `lessonId` su MongoDB |
| courseId | uuid (RelationId) | FK scalare esposta |
| deleted_at | timestamp nullable | soft delete |

Relazioni: `ManyToOne → courses (CASCADE)`, `ManyToOne → sections (SET NULL, nullable)`

#### `enrollments`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| progress_percent | int | ricalcolato da EnrollmentsService |
| enrolled_at | timestamp | auto |
| completed_at | timestamp nullable | settato quando progress=100% |

Relazioni: `ManyToOne → student_profiles`, `ManyToOne → courses`

#### `certificates`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| issued_at | timestamp | auto |
| pdf_url | text | |
| is_valid | boolean | default true |
| certificate_code | uuid unique | auto-generated |

Relazioni: `OneToOne → enrollments`

#### `reviews`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| rating | enum(Rating) | 1-5 |
| comment | text nullable | |
| created_at | timestamp | auto |

Relazioni: `OneToOne → enrollments`

#### `payments`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| amount | decimal(10,2) | |
| currency | enum(Currency) | EUR / USD / GBP |
| gateway_id | varchar | Braintree transaction ID |
| status | enum(PaymentStatus) | PENDING / COMPLETED / FAILED |
| created_at | timestamp | auto |

Relazioni: `ManyToOne → users`, `ManyToOne → courses`

#### `user_providers`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| userId | uuid FK→users | |
| provider_name | varchar | es. "google", "github" |
| provider_id | varchar | ID esterno OAuth |

---

### MongoDB (Mongoose) — connection name: `mongo_synapsis`

#### `lesson_contents`
| Campo | Tipo | Note |
|---|---|---|
| lessonId | string required unique | FK verso `lessons.id` PG — UUID reale |
| videoUrl | string required | URL pubblico (usato con USE_S3=false) |
| s3Key | string required | es. `videos/placeholder.mp4` |
| transcript | string nullable | |
| attachments | `[{ name, url, type }]` | |
| quiz | `[{ question, options, correctAnswer }]` | |

#### `lesson_progress`
| Campo | Tipo | Note |
|---|---|---|
| enrollmentId | string required | FK verso `enrollments.id` PG |
| lessonId | string required | FK verso `lessons.id` PG |
| completedAt | Date | default: Date.now |
| last_position_seconds | number | default: 0 |
| completed | boolean | default: false |

---
## Bug noti e features minori da risolvere prima o poi
 
### 🔴 Priorità alta — lesson-player

### 🟡 Priorità media — course-list (backlog)
 
1. **Filtro categoria multi-select** — `FilterState.category` è `string | null`, serve `string[]`
2. **Cursore pointer paginazione** — manca `cursor-pointer` sui bottoni pagina [RISOLTO]
3. **Contatore `total()` durante ricerca** — `search()` non restituisce `total`, mostra valore precedente
4. **Filtro livello** — UI presente ma non collegata, backend non ha campo `level`
5. **Corsi DRAFT/PENDING visibili** — manca filtro `WHERE status = 'PUBLISHED'` nel `GET /courses`
6. **rating** - implementare il sistema sia in backend che frontend (dove ora è hardcodato uguale per tutti i corsi)
---

## Note tecniche

- `USE_S3=false` in `.env` → `getVideoUrl()` restituisce `content.videoUrl` diretto (video pubblici GTVSample)
- `AWS_S3_BUCKET_NAME` è il nome corretto della variabile (allineato tra `.env` e service)
- `synchronize: true` attivo in sviluppo
- `AuthInterceptor` con refresh token queue — bug di loop da investigare separatamente
- GitLab remote: `gitlab.com/superporz1/SynapsisForge.git`
- Tailwind v4 — token semantici: `bg-surface`, `bg-surface-alt`, `text-heading`, `text-fg`, `text-fg-muted`, `text-fg-brand`, `border-l-fg-brand`
- AWS SDK v3: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- Angular naming: classe senza suffisso `Component` (es. `LessonPlayer`, `CourseList`)
- `inject()` over constructor injection in Angular
- `plainToInstance` nel service layer, non nel controller