# Session 28 — Day 85: Delete course button + VideoUpload component fix

**Date**: 2026-06-26

## Summary
Fixed VideoUploadComponent to always render (removed `@if` guard, self-contained `canUpload()` signal). Added delete course button for DRAFT/PENDING courses in instructor table. Changed backend from soft delete to hard delete to avoid 409 on re-creating courses with same title.

## Accomplished
- `video-upload.ts`: `courseId`/`lessonId` changed from `input.required()` to `input()` with defaults; added `canUpload()` computed signal; shows "Save the course first" when IDs unavailable
- `course-wizard.html`: removed `@if (lessonIds())` guard around `<app-video-upload>`
- `instructor.ts`: added `deleteCourse()` method with `confirm()` dialog
- `instructor.html`: added red trash icon delete button, hidden for PUBLISHED courses
- `courses.service.ts`: added `deleteCourse(id)` method
- `courses.service.ts` (backend): changed `softDelete` → `delete` for hard removal + CASCADE cleanup

## Pending
- Manual E2E test: upload video via wizard → S3 key saved → lesson plays with signed URL (moved to backlog)
