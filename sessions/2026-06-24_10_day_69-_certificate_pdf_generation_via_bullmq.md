# Session 2026-06-24 (10) — Day 69: Certificate PDF generation via BullMQ ✅

### Day 69 tasks completed
- Installed `pdfkit` in backend
- Created `PdfModule` + `PdfService` — generates certificate PDFs (landscape A4, double border, indigo bars, student name, course title, date, code)
- Created `CertificateListener` — listens to `enrollment.completed`, queues `generate-certificate` job to `certificate` BullMQ queue
- Created `CertificateQueueProcessor` — loads enrollment with relations, creates Certificate record, generates PDF via PdfService, saves to `uploads/certificates/`, updates `pdf_url`
- Registered `certificate` queue in QueuesModule with TypeOrm + PdfModule imports
- Removed `@OnEvent('enrollment.completed')` from `CertificatesService.create()` — PDF generation is now handled asynchronously via BullMQ
- Added test endpoint: `POST /queues/certificate/test/:enrollmentId` for manual testing
- Both `npm run build` pass clean

### Key decisions
- `CertificateListener` placed in queues module (not certificates module) — follows the same pattern as `EmailListener`
- `CertificateQueueProcessor` owns both DB record creation and PDF file generation — single atomic unit
- Frontend client-side PDF generation via `jspdf` remains as-is; backend PDFs are now available for certificate verification and download

---

