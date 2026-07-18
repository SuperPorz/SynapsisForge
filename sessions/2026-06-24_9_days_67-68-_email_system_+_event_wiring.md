# Session 2026-06-24 (9) — Days 67–68: Email system + Event wiring ✅

### Day 67: Email system — Nodemailer + SMTP
- Installed `@nestjs-modules/mailer`, `nodemailer`, `handlebars` (+ types)
- Created `MailModule` with `MailerModule.forRootAsync()` SMTP config via env
- Created `MailService` with `sendWelcomeEmail()`, `sendEnrollmentConfirmation()`, `sendTestEmail()`
- Created Handlebars templates: `welcome.hbs`, `enrollment-confirmation.hbs`
- Created `EmailQueueProcessor` with concurrency: 3 — consumes `email` BullMQ queue
- Updated `queues.controller.ts` — test email endpoint changed to `POST /queues/email/test`
- Fixed template assets in `nest-cli.json` (added `**/*.hbs`)
- Tested SMTP first with Gmail (failed — bad credentials), then switched to Gmail App Password → success
- Added `FRONTEND_URL` env var for email template links

### Day 68: Welcome email & enrollment confirmation jobs
- Injected `EventEmitter2` in `AuthService.register()` — emits `user.registered` with userId, email, name
- Modified `EnrollmentsService.enroll()` to load `studentProfile` with `relations: ['user']` — emits `enrollment.created` with email, userName, courseTitle, courseId
- Created `EmailListener` in queues module — listens to `user.registered` → queues `send-welcome-email`, listens to `enrollment.created` → queues `send-enrollment-confirmation`
- Both jobs processed successfully (confirmed via BullMQ completed set)
- Removed duplicate `BullModule.forRootAsync()` from QueuesModule (config now only in AppModule)

### Key decisions
- `EmailListener` placed in queues module (not mail module) — keeps event→job wiring close to queue infrastructure
- User email/name resolved at event source (enrollments service loads user relation) rather than in listener

---

