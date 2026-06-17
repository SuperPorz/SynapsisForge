# SynapsisForge — Handoff document
## Sessione: course-detail → enrollment → lesson-player

---

## Stato progetto

**Stack:** Angular 21 (standalone, Signals, RxJS) + Tailwind v4 — frontend. NestJS + TypeScript + PostgreSQL (TypeORM) + MongoDB (Mongoose) — backend.

---

## Cosa è stato fatto in questa sessione ✅

| Cosa | Stato |
|---|---|
| Seed reset + repopolamento DB (fix path import) | ✅ fatto |
| Corso ML (`01b236bc-7456-4380-80bc-0c47fd7566bf`) reso gratuito (`price = 0`) | ✅ fatto |
| Backend: `enroll()` — bypass check pagamento se `course.price === 0` | ✅ fatto |
| Backend: `GET /enrollments/my?courseId=:id` — controller + service (`findMyEnrollment`) | ✅ fatto |
| Frontend: `EnrollmentService` creato (`getMyEnrollment`, `enroll`) | ✅ fatto |
| Frontend: `CourseDetail` — signal `enrollment`, `isEnrolled`, `isFree`, `firstLessonId`, `enroll()`, `navigateToLesson()`, `checkEnrollment()` | ✅ fatto |
| Frontend: template `course-detail.html` — CTA condizionale sidebar + lezioni cliccabili accordion | ✅ fatto |

---

## ⚠️ PUNTO DI RIPRESA — BUG PRIORITÀ ASSOLUTA

### Bug: bottone "Iscriviti gratis" non fa nulla

**Sintomo:** click sul bottone non produce nessun effetto visibile, nessun errore in console, nessuna chiamata HTTP nei Network tools.

**Il bottone nel template è corretto:**
```html
@else if (isFree()) {
  <button
    type="button"
    (click)="enroll()"
    [disabled]="enrolling()"
    class="..."
  >
    @if (enrolling()) {
      Iscrizione in corso...
    } @else {
      Iscriviti gratis
    }
  </button>
}
```

**Ipotesi più probabile — `authService.userId()` è `null`:**

Il metodo `enroll()` in `CourseDetail` ha questo guard:
```typescript
enroll() {
  const userId = this.authService.userId();
  const courseId = this.course()?.id;
  if (!userId || !courseId || this.enrolling()) return; // ← esce silenziosamente
  // ...
}
```

Se `authService.userId()` restituisce `null` (token non ancora idratato, utente non loggato, o token scaduto), il metodo esce senza fare nulla e senza errori — esattamente il sintomo osservato.

**Come investigare:**
1. Aggiungi temporaneamente un `console.log` all'inizio di `enroll()`:
```typescript
enroll() {
  console.log('enroll called', this.authService.userId(), this.course()?.id);
  // ...
}
```
2. Se `userId` è `null` → problema di autenticazione/idratazione token
3. Se entrambi sono valorizzati → il problema è nel service o nella chiamata HTTP

**Seconda ipotesi — `isFree()` restituisce `false`:**

`isFree()` è definito come:
```typescript
isFree = computed(() => (this.course()?.price ?? 1) === 0);
```
Se il campo `price` arriva dal backend come stringa `"0"` invece che come number `0`, il confronto `=== 0` fallisce e il bottone non viene mostrato (o viene mostrato il ramo sbagliato). Verificare con `console.log('price', typeof c.price, c.price)` nel template o nel `next` della subscribe.

**Terza ipotesi — utente non loggato:**
`checkEnrollment()` ha un guard `if (!this.authService.isLoggedIn()) return;` — se l'utente non è loggato, `enrollment` rimane `null` e `isEnrolled()` è `false`, quindi il bottone appare. Ma `enroll()` esce subito perché `userId` è `null`. Assicurarsi di essere loggati con un account student prima di testare.

---

## Prossimi step — in ordine

### 1. 🔴 Fix bottone "Iscriviti gratis" (vedi sopra)

### 2. Test end-to-end flusso completo
Dopo il fix dell'enrollment:
- [ ] Login come student (`alice@example.com` / `Password123!`)
- [ ] Navigare al corso ML (gratuito, `price = 0`)
- [ ] Cliccare "Iscriviti gratis" → enrollment creato
- [ ] Bottone sidebar cambia in "Continua a studiare →"
- [ ] Lezioni accordion mostrano ▶ invece di 🔒
- [ ] Click su lezione → naviga a `/enrollments/:enrollmentId/lessons/:lessonId`
- [ ] `LessonPlayer` carica correttamente il video

### 3. Test `LessonPlayer`
- Video si carica (URL da MongoDB, `USE_S3=false`)
- Seek alla posizione salvata (`last_position_seconds`)
- `timeupdate` salva ogni 10s (Network tab)
- Evento `ended` → lezione marcata completata
- `navigateToLesson()` cambia lezione senza ricaricare la pagina
- `activeLessonId` si aggiorna al click sidebar

### 4. Backlog `course-list` (post-player)
1. `WHERE status = 'PUBLISHED'` mancante nel `GET /courses` backend
2. Filtro categoria multi-select (`string | null` → `string[]`)
3. Cursore pointer mancante sui bottoni paginazione
4. Contatore `total()` non aggiornato durante ricerca testuale
5. Filtro livello — UI presente ma non collegata, backend non ha campo `level`
6. Rating — hardcodato sia in `course-detail` che in `course-list`, da collegare ai dati reali

---

## Architettura rilevante

### Backend — EnrollmentsController
```
POST   /enrollments              → enroll() — crea enrollment (bypass pagamento se price=0)
GET    /enrollments/my?courseId= → findMyEnrollment() — restituisce enrollment o null
PATCH  /enrollments/:id/progress → aggiorna progress_percent
```

**Ordine rotte importante:** `GET /enrollments/my` deve stare PRIMA di qualsiasi `GET /enrollments/:id` per evitare conflitti di matching (attualmente non esiste `:id` get, ma tenerlo a mente).

### Frontend — EnrollmentService (`src/app/core/services/enrollment.service.ts`)
```typescript
getMyEnrollment(courseId: string): Observable<{ data: EnrollmentResponse | null }>
enroll(userId: string, courseId: string): Observable<{ data: EnrollmentResponse }>
```

### Frontend — CourseDetail signals rilevanti
```typescript
enrollment   = signal<EnrollmentResponse | null>(null)
enrolling    = signal(false)
isEnrolled   = computed(() => this.enrollment() !== null)
isFree       = computed(() => (this.course()?.price ?? 1) === 0)
firstLessonId = computed(() => this.course()?.sections?.[0]?.lessons?.[0]?.id ?? null)
```

### Corso gratuito seed
- UUID: `01b236bc-7456-4380-80bc-0c47fd7566bf`
- Title: Machine Learning (modificato con `UPDATE courses SET price = 0 WHERE id = '...'`)
- Credenziali student: `alice@example.com` / `Password123!`

---

## Note tecniche persistenti

- `USE_S3=false` in `.env` → `getVideoUrl()` restituisce `content.videoUrl` diretto
- `synchronize: true` attivo in sviluppo
- Tailwind v4 token semantici: `bg-surface`, `bg-surface-alt`, `text-heading`, `text-fg`, `text-fg-muted`, `text-fg-brand`, `border-l-fg-brand`
- Angular: `inject()` over constructor injection, `@if`/`@for`, `signal()`, `computed()`
- `plainToInstance` nel service layer, non nel controller
- GitLab remote: `gitlab.com/superporz1/SynapsisForge.git`
- `req.user` nel controller tipizzato con cast `(req as any).user['sub']` — da sistemare con tipo corretto in futuro