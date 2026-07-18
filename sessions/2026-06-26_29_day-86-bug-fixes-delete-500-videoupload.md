# Session 29 — Day 86: Bug fixes — delete, 500 on lesson creation, video upload

**Date**: 2026-06-26

## Summary
Investigated and fixed 3 major bugs. Video upload still broken at end of session (PATCH s3-key returns 404 despite lesson existing with correct courseId).

## Problems investigated

### Problem 1: Delete course button + 409 on re-create
- Old soft-deleted courses (with `deleted_at` set) couldn't be found by `verifyOwnership()` because `findOne()` auto-filters `deleted_at IS NULL`.
- Missing `onDelete: 'CASCADE'` on `Enrollment`, `CartItem`, `Payment` FK relations → FK constraint blocked hard delete.
- 409 was silent because NestJS default exception filter doesn't log HTTP exceptions.

**Fixes applied:**
- `courses.service.ts`: added `withDeleted: true` to `verifyOwnership()`'s `findOne()` call
- `courses.service.ts`: added `.withDeleted()` to `findMyCourses()` QueryBuilder
- `enrollments.entity.ts`, `cart-item.entity.ts`, `payments.entity.ts`: added `onDelete: 'CASCADE'` to `@ManyToOne(() => Course)`
- SQL cleanup: hard-deleted 3 remaining soft-deleted courses via `DELETE FROM courses WHERE deleted_at IS NOT NULL`
- Changed success message "deactivated" → "deleted"

### Problem 2: 500 on "next content & quiz" during lesson creation
- `lessons.service.ts:56` used `courseId` (a `@RelationId` property) as entity field during `create()` — `@RelationId` is read-only, cannot be used for INSERT.
- Inconsistent with all other creation patterns in codebase (`relation: { id: value }`).

**Fixes applied:**
- Changed `courseId` → `course: { id: courseId }` in `createLesson()`
- Also discovered `thumbnail_url` was `@Column()` (NOT NULL) but optional in DTO → TypeORM schema sync enforced NOT NULL → 500 on course creation. Fixed with `@Column({ nullable: true })`.

### Problem 3: Video upload — PATCH s3-key returns 404
- Multiple fix attempts, all failed:

| Attempt | Fix | Result |
|---------|-----|--------|
| 1 | Changed `courseId` to `course: { id: courseId }` in `findLesson`'s `findOne({ where })` | 404 persisted |
| 2 | Nested `where: { course: { id: courseId } }` doesn't work with TypeORM `findOne` — might generate JOIN instead of FK filter | Confirmed: lesson EXISTS in DB with correct `courseId`, but `findOne` can't find it |
| 3 | Changed `findLesson` to use QueryBuilder with `lesson.courseId = :courseId` | **Not yet tested** — built but backend needs restart |

**Root cause**: TypeORM 0.3.30 `findOne({ where: { id, course: { id: courseId } } })` does not correctly filter on the FK column. The `@RelationId` decorator creates a virtual `courseId` property that `findOne`'s nested where cannot resolve properly. Solution: use `createQueryBuilder` with explicit column reference.

## Files modified

### Backend
- `backend/src/modules/lessons/lessons.service.ts` — `createLesson()`: `courseId` → `course: { id: courseId }`; `findLesson()`: `findOne` → `createQueryBuilder`
- `backend/src/modules/courses/courses.service.ts` — `verifyOwnership()`: added `withDeleted: true`; `findMyCourses()`: added `.withDeleted()`; `delete()`: success message update
- `backend/src/common/entities/enrollments.entity.ts` — added `onDelete: 'CASCADE'`
- `backend/src/common/entities/cart-item.entity.ts` — added `onDelete: 'CASCADE'`
- `backend/src/common/entities/payments.entity.ts` — added `onDelete: 'CASCADE'`
- `backend/src/common/entities/courses.entity.ts` — `thumbnail_url` nullable

### Frontend
- `frontend/src/app/features/dashboard/instructor/course-wizard/course-wizard.ts` — `addLesson()` and `removeLesson()` now sync `lessonIds` array in parallel with `lessons`

## Pending
- **Restart backend** and test video upload (PATCH s3-key with QueryBuilder fix)
- Verify full upload flow end-to-end
