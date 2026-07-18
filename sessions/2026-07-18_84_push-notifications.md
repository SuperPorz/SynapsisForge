# Session 84 — Push notification implementation (FCM + BullMQ)

## Status
✅ Completed

## What was done

Implemented full push notification sending via Firebase Cloud Messaging (FCM) as specified in PUSH.md.

### Files created

| File | Description |
|------|-------------|
| `src/modules/queues/push-queue.processor.ts` | BullMQ `push` queue processor: initializes Firebase Admin SDK, looks up active device tokens, sends via `sendEachForMulticast`, logs to `NotificationLog`, deactivates stale tokens |

### Files modified

| File | Change |
|------|--------|
| `package.json` | Added `firebase-admin@14.2.0` dependency |
| `src/modules/queues/queues.module.ts` | Registered `push` BullMQ queue + Bull Board feature; imported `UserDevice` & `NotificationLog` entities; added `PushQueueProcessor` to providers |
| `src/modules/queues/email-listener.ts` | Injected `push` queue; dispatches push on `enrollment.created` ("Enrolled!") and `subscription.charge_failed` ("Payment failed") |
| `src/modules/queues/certificate-listener.ts` | Injected `push` queue; dispatches push on `enrollment.completed` ("Course completed!") |
| `src/modules/queues/queues.controller.ts` | Added `POST /queues/push/test` endpoint for manual push testing |
| `src/modules/enrollments/enrollments.service.ts` | Enhanced `enrollment.completed` event payload with `courseId`, `courseTitle`, `userId` |
| `infra/docker-compose-dev.yaml` | Added `FCM_CREDENTIALS: ${FCM_CREDENTIALS:-}` env var to backend service |

### Verification

- `npm run lint` → 0 errors (187 pre-existing warnings)
- `npx nest build` → success, 0 errors

### Notification template mapping

| Event | Title | Body | Type | Metadata |
|-------|-------|------|------|----------|
| Enrollment completed | "Course completed!" | "You earned a certificate for {courseTitle}" | `course_update` | `{ courseId, enrollmentId }` |
| Enrollment created | "Enrolled!" | "You've enrolled in {courseTitle}" | `course_update` | `{ courseId, enrollmentId }` |
| Subscription charge failed | "Payment failed" | "Your subscription payment failed. Please update your payment method." | `course_update` | `{}` |

### FCM Admin SDK

- Initialized at module import time using `firebase-admin/app` modular API
- Reads `FCM_CREDENTIALS` env var (JSON service account string) or falls back to Application Default Credentials
- Push queue processor uses `getMessaging().sendEachForMulticast()` with `android: { priority: 'high' }`

### How to set up FCM credentials

1. Go to Firebase Console → Project settings → Service accounts → Generate new private key
2. Copy the JSON, minify to single line
3. Add to `.env.development`: `FCM_CREDENTIALS={"type":"service_account",...}`
