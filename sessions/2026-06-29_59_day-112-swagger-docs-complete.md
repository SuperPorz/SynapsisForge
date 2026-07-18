# Session 59 — Day 112: Swagger — complete API documentation (2026-06-29)

## Summary
Completed Day 112 — audited and fixed all Swagger/OpenAPI documentation across every backend controller.

## What was done

### 1. Fixed `@ApiBearerAuth` inconsistency on public routes
- **ReviewsController**: Removed class-level `@ApiBearerAuth()`, added method-level on `POST`, `PATCH`, `DELETE` only. `GET /reviews/course/:courseId` (public) no longer shows lock icon.
- **CertificatesController**: Removed class-level `@ApiBearerAuth()`, kept existing method-level on protected routes. `GET /certificates/verify/:code` (public) no longer shows lock.
- **PaymentsController**: Removed class-level `@ApiBearerAuth()`, added method-level on `checkout`, `subscribe`, `getStatus`, `cancel`, `getHistory`. Removed redundant `@ApiBearerAuth()` from `client-token` and `webhook` (both `@Public()`).

### 2. Added missing `@ApiParam` decorators (~33 path parameters)
| Controller | Params added |
|------------|-------------|
| ReviewsController | `:id` on PATCH and DELETE |
| QueuesController | `:enrollmentId`, `:paymentId` |
| AuthController | `:token` on verify-email |
| LessonPlayerController | `:enrollmentId`, `:lessonId` on both routes |
| LessonsController | `:courseId`, `:id` on all 7 routes |
| CoursesController | `:id`, `:slug`, `:courseId`, `:sectionId` on 11 routes |

### 3. Added missing `@ApiBody`
- `POST /queues/email/test` — documented `to` parameter
- `POST /queues/maintenance/test` — documented `jobName` parameter

### 4. Added missing `@ApiResponse`
- `GET /payments/history` — was entirely missing; added `200` response

### 5. Translated Italian → English descriptions
- **AuthController**: All 8 route summaries and response descriptions
- **EnrollmentsController**: All 5 route summaries and response descriptions
- **AdminController**: All 6 route summaries and response descriptions
- **CertificatesController**: All 5 route summaries and response descriptions

### 6. Verification
- Backend build: ✅ 0 errors
- Docker images rebuilt (backend + frontend) and containers restarted
- Swagger UI: `localhost:8080/api/docs/` → 200 ✅
- OpenAPI spec verified: security schemes correct, public routes have no lock icon, English descriptions confirmed, all params documented
- Frontend: `localhost:8080/` → 200 ✅

## Files modified
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/modules/certificates/certificates.controller.ts`
- `backend/src/modules/courses/courses.controller.ts`
- `backend/src/modules/enrollments/enrollments.controller.ts`
- `backend/src/modules/lessons/lesson-player.controller.ts`
- `backend/src/modules/lessons/lessons.controller.ts`
- `backend/src/modules/payments/payments.controller.ts`
- `backend/src/modules/queues/queues.controller.ts`
- `backend/src/modules/reviews/reviews.controller.ts`
- `PLAN.md` — Day 112 marked ✅
- `TODO.md` — pre-loaded Day 114
