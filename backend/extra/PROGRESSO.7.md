# SynapsisForge — Handoff Document
## Sessione: fix definitivo lesson-player (doppio unwrap interceptor) + video URL + prep quiz interattivo

---

## Stato attuale ✅

| Cosa | Stato |
|---|---|
| Bug — `Cannot read properties of undefined (reading 'videoUrl')` in `lesson-player.ts` | ✅ risolto |
| Causa | Doppio unwrap: `transformInterceptor` (HTTP interceptor Angular) spoglia già `{ data, statusCode, timestamp }` restituendo direttamente il payload, ma `LessonsService.getVideoUrl()` faceva ancora `.pipe(map((res) => res.data))` aspettandosi l'involucro. Risultato: `res.data` → `undefined` → crash al primo accesso campo nel subscribe |
| Fix applicato | `getVideoUrl()` tipizza la response HTTP direttamente come `LessonVideoResponse` (niente più wrapper `{ data: T }` né `.map()`) |
| Verifica | Controllati tutti gli altri service del progetto — `getVideoUrl()` era l'unico rimasto col pattern vecchio, sweep già fatto correttamente altrove |
| Bug — video non riproducibile, `AccessDenied` da Google Cloud Storage | ✅ risolto |
| Causa | Bucket `gtv-videos-bucket` (Google sample videos) ha smesso di garantire accesso pubblico/anonimo — problema noto e diffuso, non specifico del progetto |
| Fix applicato | `TEST_VIDEOS` in `mongo.seed.ts` sostituito con 10 URL stabili da `test-videos.co.uk` (Big Buck Bunny + Jellyfish, vari bitrate/risoluzioni, H.264). Nessuno script aggiuntivo necessario: `seedMongo()` già fa `deleteMany` + `insertMany` con assegnazione round-robin via `index % TEST_VIDEOS.length`, quindi un singolo `npm run db:seed:mongo` ripropaga i nuovi URL a tutti i 240 documenti |
| Nota CORS | `test-videos.co.uk` non supporta `fetch()` cross-origin, ma questo non è un problema per noi: il tag `<video>` HTML non è soggetto alla stessa restrizione CORS di `fetch()`/`XHR`, quindi la riproduzione diretta nel player funziona senza problemi |

---

## Commit suggerito (sessione corrente)

```
fix(lesson-player): resolve double-unwrap crash and stale video URLs

- LessonsService.getVideoUrl(): remove redundant `{ data: T }` wrapper type
  and `.pipe(map((res) => res.data))`. transformInterceptor already unwraps
  the API envelope at the HTTP layer, so the service was reading `.data`
  off an already-unwrapped object, producing `undefined` and crashing on
  first property access in the component subscribe handler
  (Cannot read properties of undefined (reading 'videoUrl'))
- Audited all other services for the same double-unwrap pattern: none found,
  getVideoUrl() was the only leftover from before the interceptor sweep
- mongo.seed.ts: replace TEST_VIDEOS (Google gtv-videos-bucket, now returning
  AccessDenied for anonymous access) with 10 stable URLs from
  test-videos.co.uk (Big Buck Bunny + Jellyfish, H.264, mixed bitrates).
  No extra script needed — existing seedMongo() round-robin logic
  (index % TEST_VIDEOS.length) repropagates correctly via db:seed:mongo
```

---

## 🎯 Prossime task — Quiz interattivo nel player

1. **Componente Quiz** (Angular)
   - Mostra le domande una alla volta, con animazione di transizione tra una domanda e la successiva
   - Dato disponibile in `LessonContent.quiz` (array — il seed attuale ne genera una sola per lezione, ma il componente deve gestire comunque un array di lunghezza variabile, incluso il caso singolo)

2. **Feedback immediato**
   - Risposta corretta → evidenziazione verde + testo di spiegazione
   - Risposta sbagliata → evidenziazione rossa + mostra la risposta corretta
   - Nota: lo schema Mongo (`lesson-content.schema.ts`) e i dati seed (`QUIZZES` in `mongo.seed.ts`) non hanno un campo `explanation` — da aggiungere se si vuole la spiegazione testuale, oppure generarla lato frontend mostrando semplicemente "Risposta corretta: X"

3. **Salvataggio completamento quiz**
   - Via `POST /enrollments/:id/progress` — **da verificare**: nel backend attuale la route reale è `PATCH /enrollments/:enrollmentId/lessons/:lessonId/progress`, gestita da `LessonPlayerController.updateProgress()` → `LessonsService.updateLessonProgress()`. Chiarire se si intende riusare questa route passando `completed: true` quando il quiz è superato, o se serve un endpoint dedicato

4. **Modale di congratulazioni a fine corso**
   - Al completamento dell'ultima lezione, mostrare un modale con link al certificato
   - Verificare se esiste già un evento/hook recuperabile lato frontend per il completamento corso (`EnrollmentsService` emette `enrollment.completed` e aggiorna `progress_percent`), o se va aggiunto un check esplicito dopo ogni `updateProgress()` (es. confrontare `completedLessonIds.length` con il totale lezioni del corso, ottenibile da `sections.flatMap(lessons).length` nella response di `getVideoUrl()`)
   - Certificato: verificare se esiste già un endpoint `GET /certificates/:enrollmentId` (o simile) per ottenere l'URL/PDF da linkare nel modale — vedi tabella `certificates` nella mappa entità sotto (`pdf_url`, `certificate_code`)

**Da chiarire in apertura della prossima sessione**, prima di scrivere codice:
- Schema esatto di `LessonContent.quiz` in Mongo (manca `explanation`?)
- Route reale per salvare completamento quiz (riuso di `updateProgress` o nuovo endpoint?)
- Esistenza/path dell'endpoint certificato per il modale finale

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
| quiz | `[{ question, options, correctAnswer }]` | manca `explanation` — vedi task quiz |

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

(nessun bug bloccante aperto al momento — il 404 e il crash su `videoUrl` sono risolti; il buffering/freeze video segnalato in sessioni precedenti era legato a rete locale instabile, non confermato come bug applicativo, da ri-testare se si ripresenta con rete pulita)

### 🟡 Priorità media — course-list (backlog)

1. **Filtro categoria multi-select** — `FilterState.category` è `string | null`, serve `string[]`
2. **Cursore pointer paginazione** — manca `cursor-pointer` sui bottoni pagina [RISOLTO]
3. **Contatore `total()` durante ricerca** — `search()` non restituisce `total`, mostra valore precedente
4. **Filtro livello** — UI presente ma non collegata, backend non ha campo `level`
5. **Corsi DRAFT/PENDING visibili** — manca filtro `WHERE status = 'PUBLISHED'` nel `GET /courses`
6. **rating** — implementare il sistema sia in backend che frontend (dove ora è hardcodato uguale per tutti i corsi)

---

## Note tecniche

- `USE_S3=false` in `.env` → `getVideoUrl()` restituisce `content.videoUrl` diretto (video pubblici da `test-videos.co.uk`, lista in `TEST_VIDEOS` dentro `mongo.seed.ts`)
- `AWS_S3_BUCKET_NAME` è il nome corretto della variabile (allineato tra `.env` e service)
- `synchronize: true` attivo in sviluppo
- `AuthInterceptor` con refresh token queue — bug di loop da investigare separatamente
- **`transformInterceptor` (HTTP, Angular)**: unwrappa globalmente `{ data, statusCode, timestamp }` → `data` a livello di risposta HTTP. Ogni service deve tipizzare le chiamate `.get<T>()`/`.post<T>()` ecc. direttamente come il tipo finale atteso, **senza** wrapper `{ data: T }` né ulteriori `.map((res) => res.data)` — pattern già verificato e corretto su tutti i service esistenti, ma da controllare per primo in caso di futuri crash "undefined" su nuove chiamate HTTP
- Database Mongo reale: `mongo_synapsis` — collezione `lesson_content`
- `connectionName` MongoDB: `mongo_synapsis` — centralizzato in `getMongoUri()` (legge `MONGO_URI` + credenziali da `.env`)
- Ordine di esecuzione seed: Postgres prima (categories → users → courses → sections/lessons → enrollments), poi MongoDB riceve i lessonId reali da Postgres — se il seed Postgres fallisce a metà, Mongo non viene mai popolato/aggiornato in quella run (vale per `seed.ts`, non per `seed-mongo-only.ts`/`db:seed:mongo` che è standalone)
- `jwt.strategy.ts` → `validate()` ritorna l'entity `User` intera → `req.user.id` (non `req.user.sub`)
- GitLab remote: `gitlab.com/superporz1/SynapsisForge.git`
- Tailwind v4 — token semantici: `bg-surface`, `bg-surface-alt`, `text-heading`, `text-fg`, `text-fg-muted`, `text-fg-brand`, `border-l-fg-brand`
- AWS SDK v3: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- Angular naming: classe senza suffisso `Component` (es. `LessonPlayer`, `CourseList`)
- `inject()` over constructor injection in Angular
- `plainToInstance` nel service layer, non nel controller
- Pattern di iniezione cross-modulo: ogni modulo registra direttamente le entità/schemi di cui ha bisogno nel proprio `forFeature` (sia TypeORM che Mongoose), invece di esportare i moduli interi