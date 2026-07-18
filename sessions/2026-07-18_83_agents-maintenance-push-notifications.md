# Session 83 — AGENTS.md maintenance mode rewrite + Push notification endpoints

**Date**: 2026-07-18

## Work done

### 1. AGENTS.md → Maintenance mode
- Section 2 "Goal" replaced with "Status": platform fully developed, maintenance mode
- Removed all PLAN/TODO loading workflow: sections 5.1 (Golden rule), 6.1-6.5 (Start-flow, End-flow, Expansion rule, Safety checks)
- PLAN.md and TODO.md marked as "Archived" in agentic files table
- Added rule #7: PLAN.md and TODO.md are archived, not to be read/modified in workflow
- Simplified session workflow to direct instruction mode

### 2. Push notification endpoints
Implemented 3 new endpoints in `NotificationsModule`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/notifications/devices` | Register/upsert FCM device token per user+platform |
| DELETE | `/notifications/devices/:tokenId` | Remove device token (ownership verified) |
| GET | `/notifications/devices` | List active devices for authenticated user |

#### Files created
- `src/common/entities/enum/notifications.enum.ts` — DevicePlatform (android/ios), NotificationType (lesson_new, progress_update, course_update, announcement)
- `src/common/entities/user-device.entity.ts` — table `user_devices` with unique per (user_id, platform) upsert
- `src/common/entities/notification-log.entity.ts` — table `notification_log` for sent notifications
- `src/modules/notifications/dto/create-device.dto.ts` — token + platform
- `src/modules/notifications/dto/response-device.dto.ts` — id, user_id, token (full), platform, active, created_at
- `src/modules/notifications/notifications.module.ts`
- `src/modules/notifications/notifications.controller.ts`
- `src/modules/notifications/notifications.service.ts`

#### Files modified
- `src/app.module.ts` — added `NotificationsModule`

## Verification
- `npm run build` ✅
- `npm run lint` ✅ (0 errors, only pre-existing warnings)
- `npm run test` ✅ (8 suites, 85 tests passed)
