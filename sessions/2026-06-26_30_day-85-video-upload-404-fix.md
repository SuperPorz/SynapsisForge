# Session 30 — Day 85: Video upload 404 fix (PATCH s3-key)

**Date**: 2026-06-26

## Problem

`PATCH /courses/:courseId/lessons/:lessonId/s3-key` returned 404 (Not Found) during video upload.

## Root causes

### Cause 1: `findLesson()` using `findOne({ where: { id, course: { id: courseId } } })`
TypeORM 0.3.30 cannot resolve nested `course: { id: courseId }` in `findOne()`'s `where`. Already fixed to `createQueryBuilder` in Session 29, but backend was not restarted, so the old code was still running.

### Cause 2: MongoDB document doesn't exist at upload time
`updateS3Key()` called `findOneAndUpdate({ lessonId })` on `lesson_contents`, but the document is only created when the course is published (`POST :id/content`). At upload time (during the wizard), the doc doesn't exist yet → 404.

Also: when the doc WOULD exist (from a prior upload), `createContent()` used `save()` which would throw a duplicate key error on the `unique: true` `lessonId` field.

## Fixes applied

### Backend
- `update-s3-key.dto.ts` — added optional `videoUrl` field
- `lessons.controller.ts` — passes `dto.videoUrl` to service
- `lessons.service.ts`:
  - `updateS3Key()`: now accepts `videoUrl?`, uses `$set { s3Key, videoUrl }` with `{ upsert: true, returnDocument: 'after' }`
  - `createContent()`: changed from `new Model().save()` to `findOneAndUpdate` with `{ upsert: true, returnDocument: 'after' }` (prevents duplicate key on publish when doc already exists from upload)
  - Fixed Mongoose deprecation: `{ new: true }` → `{ returnDocument: 'after' }` in both `updateContent()` and `updateS3Key()`

### Frontend
- `lessons.service.ts` — `updateS3Key()` accepts optional `videoUrl` parameter
- `video-upload.ts` — passes `publicUrl` to `updateS3Key()` so both `s3Key` and `videoUrl` are stored atomically

## Files modified
- `backend/src/modules/lessons/dto/update-s3-key.dto.ts`
- `backend/src/modules/lessons/lessons.controller.ts`
- `backend/src/modules/lessons/lessons.service.ts`
- `frontend/src/app/core/services/lessons.service.ts`
- `frontend/src/app/shared/components/video-upload/video-upload.ts`

## Pending
- User must restart backend for changes to take effect (or verify `--watch` auto-restarted)
- Manual verification: upload video via course-wizard Step 4
