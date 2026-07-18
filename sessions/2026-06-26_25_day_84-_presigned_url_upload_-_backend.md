# Session 2026-06-26 (25) — Day 84: Presigned URL upload — backend ✅

### Completed
- **Created `PresignedUrlDto`** (`upload/dto/presigned-url.dto.ts`) — `fileName` + `contentType` with class-validator decorators
- **Imported `S3Module`** in `UploadModule` — `S3Service` now injectable in upload controller
- **Added `POST /uploads/presigned-url`** to `UploadController` — generates UUID-based S3 key, returns `{ uploadUrl, key, publicUrl }` with 10-min presigned PUT URL
- **Created `UpdateS3KeyDto`** (`lessons/dto/update-s3-key.dto.ts`) — `s3Key` field
- **Added `updateS3Key()`** method in `LessonsService` — updates `s3Key` on `LessonContent` MongoDB document via `findOneAndUpdate`
- **Added `PATCH /courses/:courseId/lessons/:id/s3-key`** to `LessonsController` — instructor-only endpoint to save S3 key after upload
- **Build**: `npx nest build` — clean
- **One-shot test**: instructor login → `POST /uploads/presigned-url` → `200` with `{ uploadUrl (10-min presigned PUT), key, publicUrl }` ✅
- **AGENTS.md updated**: §3 one-shot exception removed, §12 service management rule hardened (NEVER start/stop services)

### Files created
- `backend/src/modules/upload/dto/presigned-url.dto.ts`
- `backend/src/modules/lessons/dto/update-s3-key.dto.ts`

### Files modified
- `backend/src/modules/upload/upload.module.ts`
- `backend/src/modules/upload/upload.controller.ts`
- `backend/src/modules/lessons/lessons.service.ts`
- `backend/src/modules/lessons/lessons.controller.ts`
- `AGENTS.md`

---

