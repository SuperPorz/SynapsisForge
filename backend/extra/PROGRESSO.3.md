# SynapsisForge — Handoff Document
## Sessione: course-detail debug (bottone enrollment + 404 video)

---

## Stato attuale ✅

| Cosa | Stato |
|---|---|
| `transformInterceptor` funzionale — unwrap automatico `{ data, statusCode, timestamp }` | ✅ fatto |
| `PaginatedCoursesResponse` interfaccia aggiornata (post-interceptor) | ✅ fatto |
| `SearchCoursesResponse` interfaccia aggiornata (post-interceptor) | ✅ fatto |
| `getCourseById` / `getCategories` tipi semplificati in `CourseService` | ✅ fatto |
| `course-detail.ts` — `response.data` → `response`, `response.data.id` → `response.id` | ✅ fatto |
| `course-list.ts` — `loadCourses()` e `onPriceChange()` allineati post-interceptor | ✅ fatto |
| `featured-courses.ts` — `response.data.data` → `response.data` | ✅ fatto |
| `loadCategories()` — `response.data` → `response` | ✅ fatto |
| MongoDB seed rieseguito con `npm run db:seed:mongo` — ora tutti i corsi hanno `LessonContent` | ✅ fatto |
| `checkEnrollment()` — aggiunto `enrollment.set(null)` prima della chiamata + `error` callback | ✅ fatto |

---

## ⚠️ BUG APERTI

### Bug 1 — Bottone mostra "Continua a studiare" anche senza enrollment

**Sintomo:** Anche con utente nuovo (nessun enrollment), il bottone mostra "Continua a studiare" invece di "Iscriviti gratis".

**Ipotesi da verificare in ordine:**

#### A) `getMyEnrollment()` non ritorna errore ma un valore truthy

Il backend `GET /enrollments/my?courseId=` potrebbe restituire `null` come body con status `200` invece di `404`. In questo caso l'interceptor unwrappa `{ data: null }` → `null`, ma il tipo `Observable<EnrollmentResponse | null>` riceve `null` come `next` (non come `error`), quindi `enrollment.set(null)` viene chiamato correttamente.

**Verifica:** Aprire DevTools → Network → filtrare per `enrollments/my` e controllare:
- Status code della risposta (200 o 404?)
- Body della risposta (null? oggetto? array vuoto?)

#### B) Il template legge `isEnrolled` in modo errato

**Verifica:** Controllare nel template `course-detail.html` riga ~182 la condizione esatta che mostra i due bottoni. Cercare:
```bash
grep -n "isEnrolled\|Continua\|Iscriviti" src/app/features/courses/course-detail/course-detail.html
```

#### C) `checkEnrollment()` non viene chiamata con il `courseId` corretto

**Verifica:** Aggiungere un `console.log` temporaneo:
```typescript
private checkEnrollment(courseId: string) {
  console.log('[checkEnrollment] courseId:', courseId);
  if (!this.authService.isLoggedIn()) return;

  this.enrollment.set(null);
  this.enrollmentService.getMyEnrollment(courseId).subscribe({
    next: (enrollment) => {
      console.log('[checkEnrollment] enrollment ricevuto:', enrollment);
      this.enrollment.set(enrollment);
    },
    error: (err) => {
      console.log('[checkEnrollment] errore:', err);
      this.enrollment.set(null);
    },
  });
}
```

Poi in console verificare cosa arriva.

#### D) `EnrollmentsController` — endpoint `GET /enrollments/my`

**Verifica:** Controllare cosa ritorna il controller quando non esiste enrollment:
```bash
# Cerca findMyEnrollment o simile nel controller
grep -n "my\|findMy\|getMyEnrollment" src/modules/enrollments/enrollments.controller.ts
```

Il backend dovrebbe ritornare `404` o `null`. Se ritorna `{}` (oggetto vuoto), `enrollment()` sarà truthy e `isEnrolled` sarà `true`.

---

### Bug 2 — 404 su `GET /enrollments/:id/lessons/:lessonId/video`

**Errore in console:**
```
GET http://localhost:3000/enrollments/163eb40f-d8ff-4abf-b50a-6672b052cdd2/lessons/1464c78c-4ec8-4546-a1c1-b7c2ee56eeb0/video 404 (Not Found)
```

**Causa probabile:** L'`enrollmentId` `163eb40f-d8ff-4abf-b50a-6672b052cdd2` non esiste più in PostgreSQL (utente di test diverso, o enrollment non creato correttamente).

**Stack trace:**
```
loadLesson         @ lesson-player.ts:70
ngOnInit           @ lesson-player.ts:48
navigateToLesson   @ course-detail.ts:103
```

**Ipotesi da verificare in ordine:**

#### A) L'enrollment ID nell'URL è stale (da sessione precedente)

L'enrollment `163eb40f-...` potrebbe essere di un utente diverso o non esistere. Verificare in mongosh o via API:
```
# Nel container NestJS con curl
curl -H "Authorization: Bearer <token>" "http://localhost:3000/enrollments/my?courseId=01b236bc-7456-4380-80bc-0c47fd7566bf"
```
Questo ritorna l'enrollment reale dell'utente loggato con il suo ID corretto.

#### B) `LessonsService.getVideoUrl()` — passo 1 lancia NotFoundException

```typescript
const enrollment = await this.enrollmentsService.findById(enrollmentId);
if (!enrollment) throw new NotFoundException(...);
```

**Verifica:** Controllare `findById()` in `EnrollmentsService` — carica la relazione `course`?
```typescript
// Deve avere relations: ['course'] altrimenti il passo 6 (sections) fallisce
findById(id: string): Promise<Enrollment | null> {
  return this.enrollmentRepository.findOne({
    where: { id },
    relations: ['course'], // ← obbligatorio
  });
}
```

#### C) `LessonContent` non trovato per quella lezione specifica

Anche dopo il seed MongoDB, verificare che il documento esista:
```javascript
// In mongosh
use synapsisforge
db.lessoncontents.findOne({ lessonId: "1464c78c-4ec8-4546-a1c1-b7c2ee56eeb0" })
```
Deve ritornare un documento con `videoUrl` valorizzato.

#### D) `lesson-player.ts` — come costruisce la URL di chiamata

Controllare riga ~70 di `lesson-player.ts`:
```typescript
// Deve chiamare:
// GET /enrollments/:enrollmentId/lessons/:lessonId/video
// con gli ID presi dai route params, NON da valori hardcoded o stale
```

---

## File coinvolti

| File | Bug |
|---|---|
| `src/app/features/courses/course-detail/course-detail.ts` | Bug 1 + Bug 2 |
| `src/app/features/courses/course-detail/course-detail.html` | Bug 1 (template) |
| `src/app/core/services/enrollment.service.ts` | Bug 1 |
| `src/app/features/lessons/lesson-player/lesson-player.ts` | Bug 2 |
| `src/modules/enrollments/enrollments.controller.ts` | Bug 1 (backend) |
| `src/modules/enrollments/enrollments.service.ts` | Bug 2 (`findById`) |

---

## Note tecniche persistenti

- `USE_S3=false` in `.env` → `getVideoUrl()` usa `content.videoUrl` diretto
- Tailwind v4 token semantici: `bg-surface`, `bg-surface-alt`, `text-heading`, `text-fg`, `text-fg-muted`, `text-fg-brand`
- Angular: `inject()`, `@if`/`@for`, `signal()`, `computed()`
- `plainToInstance` nel service layer, non nel controller
- GitLab remote: `gitlab.com/superporz1/SynapsisForge.git`
- Credenziali student seed: `alice@example.com` / `Password123!`
- Corso gratuito seed: UUID `01b236bc-7456-4380-80bc-0c47fd7566bf` (Machine Learning, `price = 0`)
- Script seed MongoDB-only: `npm run db:seed:mongo`

---

## Commit suggerito (sessione corrente)

```
fix(http): align all components/interfaces to post-interceptor response shape

- Update PaginatedCoursesResponse and SearchCoursesResponse interfaces
- Fix CourseService getCourseById/getCategories generic types
- Fix course-detail: remove .data wrapper from getCourseById subscribe
- Fix course-list: loadCourses, onPriceChange, loadCategories post-interceptor
- Fix featured-courses: response.data.data → response.data
- Re-seed MongoDB with db:seed:mongo to populate LessonContent for all courses
- Fix checkEnrollment: reset signal to null before async call + error handler

TODO: debug isEnrolled always true (Bug 1) + 404 on video endpoint (Bug 2)
```