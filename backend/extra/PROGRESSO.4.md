# SynapsisForge — Handoff Document
## Sessione: course-detail debug (enrollment bug)

---

## Stato attuale ✅

| Cosa | Stato |
|---|---|
| `TransformInterceptor` NestJS — wrappa correttamente `null` in `{ data: null, statusCode: 200 }` | ✅ confermato |
| `TransformInterceptor` Angular — unwrappa `.data` correttamente | ✅ confermato |
| Bug 1 (bottone "Continua a studiare" sempre visibile) — causa identificata: `findMyEnrollment` query TypeORM errata | ✅ identificato |
| `findMyEnrollment` riscritta con `QueryBuilder` | ✅ fatto (ma ancora buggy) |
| DB confermato: alice (`88b7d0e3-...`) ha enrollment `c983112e-...` per corso ML (`01b236bc-...`) | ✅ confermato |

---

## 🔧 IN CORSO — `findMyEnrollment` con QueryBuilder

Il metodo attuale in `src/modules/enrollments/enrollments.service.ts`:

```typescript
async findMyEnrollment(
  userId: string,
  courseId: string,
): Promise<ResponseEnrollmentDto | null> {
  const query = this.enrollmentRepository
    .createQueryBuilder('enrollment')
    .innerJoin('enrollment.student', 'student')
    .innerJoin('enrollment.course', 'course')
    .where('student.userId = :userId', { userId })
    .andWhere('course.id = :courseId', { courseId });

  console.log('[findMyEnrollment] SQL:', query.getSql());
  console.log('[findMyEnrollment] params:', { userId, courseId });

  const enrollment = await query.getOne();
  console.log('[findMyEnrollment] result:', enrollment);

  return enrollment ? this.toDto(enrollment) : null;
}
```

**La prossima sessione inizia con l'output di questo log in console NestJS.**

Sintomo attuale: ritorna `null` nonostante l'enrollment esista nel DB. Sospetto: il join su `student.userId` non matcha correttamente la colonna `studentUserId` nel DB.

---

## ⚠️ BUG APERTI

### Bug 1 — `findMyEnrollment` ritorna `null` per alice nonostante enrollment esista

**Dati noti:**
- alice userId: `88b7d0e3-58f2-4e2f-b65d-8432bb7f047c`
- corso ML courseId: `01b236bc-7456-4380-80bc-0c47fd7566bf`
- enrollment corretto di alice: `c983112e-e6c0-4338-830c-653009d712a5`
- colonna FK nel DB: `studentUserId` (non `studentId`)

**Ipotesi:** TypeORM `QueryBuilder` con `student.userId` genera SQL che cerca `student_user_id` o `studentId` invece di `studentUserId`. Verificare la SQL loggata.

**Fix alternativo da provare se il log conferma SQL errata:**
```typescript
// Approccio diretto sulla FK senza join
const enrollment = await this.enrollmentRepository.findOne({
  where: {
    student: { userId: userId },
    course: { id: courseId },
  },
  relations: ['course', 'student'],
});
```

Oppure query raw:
```typescript
const enrollment = await this.enrollmentRepository
  .createQueryBuilder('enrollment')
  .where('enrollment.studentUserId = :userId', { userId })
  .andWhere('enrollment.courseId = :courseId', { courseId })
  .getOne();
```

### Bug 2 — 404 su `GET /enrollments/:id/lessons/:lessonId/video`

**Dipende da Bug 1** — una volta che `findMyEnrollment` ritorna l'enrollment corretto (`c983112e-...`), il `navigateToLesson` passerà l'ID giusto a `lesson-player`. Da verificare dopo il fix di Bug 1.

---

## Dati di riferimento

| Cosa | Valore |
|---|---|
| alice email | `alice@example.com` |
| alice userId | `88b7d0e3-58f2-4e2f-b65d-8432bb7f047c` |
| corso ML (gratuito) courseId | `01b236bc-7456-4380-80bc-0c47fd7566bf` |
| enrollment alice→ML | `c983112e-e6c0-4338-830c-653009d712a5` |
| altro enrollment stale (altro utente) | `163eb40f-d8ff-4abf-b50a-6672b052cdd2` |

---

## File coinvolti

| File | Bug |
|---|---|
| `src/modules/enrollments/enrollments.service.ts` | Bug 1 — `findMyEnrollment` |
| `src/modules/enrollments/enrollments.controller.ts` | Bug 1 — `getMyEnrollment` |
| `src/app/features/courses/course-detail/course-detail.ts` | Bug 1 + Bug 2 |
| `src/app/features/courses/course-detail/course-detail.html` | Bug 1 (template) |
| `src/app/core/services/enrollment.service.ts` | Bug 1 (Angular) |
| `src/app/features/lessons/lesson-player/lesson-player.ts` | Bug 2 |

---

## Note tecniche persistenti

- `USE_S3=false` in `.env` → `getVideoUrl()` usa `content.videoUrl` diretto
- Tailwind v4 token semantici: `bg-surface`, `bg-surface-alt`, `text-heading`, `text-fg`, `text-fg-muted`, `text-fg-brand`
- Angular: `inject()`, `@if`/`@for`, `signal()`, `computed()`
- `plainToInstance` nel service layer, non nel controller
- GitLab remote: `gitlab.com/superporz1/SynapsisForge.git`
- Docker container postgres: `infra-postgres-1`, user: `admin`, db: `pg_database`
- Script seed MongoDB-only: `npm run db:seed:mongo`

---

## Commit suggerito (sessione corrente)

```
fix(enrollments): rewrite findMyEnrollment with QueryBuilder for correct student filter

- Replace TypeORM nested where (student: { userId }) with explicit QueryBuilder
- Add temporary console.log to debug SQL generation (to be removed after fix)

TODO: verify SQL output and fix null return despite existing enrollment (Bug 1)
TODO: verify video 404 after Bug 1 fix (Bug 2)
```