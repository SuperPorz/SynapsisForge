# Session 2026-06-26 (21) — Day 81: Payment history & receipts ✅

### Completed
- **GET /payments/history**: `PaymentsService.getHistory()` with pagination (page/limit), sorted by created_at DESC, returns `{ data, total, page, limit }`
- **PaymentHistoryItem DTO**: Exposes id, amount, currency, payment_method, gateway_id, status, receipt_url, created_at, courseId, courseTitle via class-transformer
- **receipt_url column**: Added to Payment entity (`varchar nullable`) — populated by BullMQ job after PDF generation
- **PdfService.generateReceipt()**: Generates A4 portrait receipt with transaction ID, date, customer name, amount, payment method, course title, Receipt ID footer
- **ReceiptQueueProcessor**: New `receipt` BullMQ queue with 3 retry attempts (exponential backoff), registered in QueuesModule + BullBoard
- **Receipt test endpoint**: `POST /queues/receipt/test/:paymentId` (public)
- **Frontend PaymentHistoryComponent**: Lazy-loaded at `/dashboard/payment-history`, table with Date/Course/Amount/Method/Status/Receipt columns, pagination controls, empty state
- **Frontend route + sidebar**: Route added to dashboard children, "Payment history" link in Student sidebar section
- **PaymentsService extended**: Merged `getHistory()` into existing frontend PaymentsService

### Key decisions
- Receipt PDFs stored in `uploads/receipts/{paymentId}.pdf`, served as static files
- Receipt queue uses same retry policy as certificate queue (3 attempts, exponential 2s base)
- Existing `PaymentsService` on frontend was restored from git and extended (not replaced) — all existing checkout/subscription methods preserved
- Course FK on Payment remains nullable — subscription charge payments have no course association

---

