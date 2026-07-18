# Session 32 — Day 87: Migrate certificate PDFs to S3

**Date**: 2026-06-26

## Summary
Migrated certificate PDF generation from local filesystem to S3 (`synapsisforge-private` bucket). 
End-to-end flow: enrollment completion → BullMQ job → PdfService generates Buffer → S3Client.putObject() → presigned GET URL for download.

## Files modified

### Backend
- `certificate.entity.ts` — added `s3_key` (varchar, nullable)
- `pdf.service.ts` — `generateCertificate()` returns `Promise<Buffer>` (no longer writes to file); fixed PDF layout (y-position accumulator prevents text overlap)
- `s3.service.ts` — added `putObject(key, body, contentType, bucket?)` method
- `certificate-queue.processor.ts` — uploads PDF to S3 with `USE_S3` fallback (also: uses Buffer from PdfService, stores `s3_key`)
- `certificates.service.ts` — added `download(id, userId)` returning presigned GET URL with ownership check; `findByUser()` includes `s3_key`
- `certificates.controller.ts` — added `GET /certificates/:id/download`
- `certificates.module.ts` — imports `S3Module`
- `queues.module.ts` — imports `S3Module`
- `enrollments.seed.ts` — removed fake certificate placeholder (`synapsis.dev` URLs); seed now generates real PDFs via PdfService + uploads to S3/local

### Frontend
- `certificates.service.ts` — added `getDownloadUrl(id)`, `UserCertificate.s3_key`, `DownloadUrlResponse` interface
- `certificates.ts` — `download()` calls API for presigned URL (if `s3_key`) or falls back to direct `pdf_url`
- `certificates.html` — guard updated to `@if (c.s3_key || c.pdf_url)`
- `lesson-player.html` — fixed `routerLink` from `/profile/my-certificates` → `/dashboard/certificates`

## Testing
- ✅ Backend NestJS build passes
- ✅ Frontend ng build passes
- ✅ `GET /certificates/my` returns `s3_key: certificates/...pdf` for S3-based certs
- ✅ `GET /certificates/:id/download` returns valid presigned URL (verified against live S3 bucket)
- ✅ Old certificates (pre-migration) return `s3_key: null` — download falls back to `pdf_url`
- ✅ Seed now generates real, downloadable PDF certificates
- ✅ User completed a course → BullMQ job generated certificate → uploaded to S3 → presigned URL works
