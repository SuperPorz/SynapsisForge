# Session 2026-06-25 (11) — Day 70: Scheduled jobs + Bull Board ✅ + mailer refactoring 🧹

### Completed
- **Day 70**: Bull Board at `/admin/queues` with admin auth middleware (HTTP 200 ✅)
- **Day 70**: Cron jobs `daily-student-digest` (0 9 * * *) and `cleanup-expired-tokens` (0 3 * * 0) registered and working
- **Day 70**: Maintenance queue + processor (cleanup stale Redis session keys)
- **Mailer refactoring**: Removed `@nestjs-modules/mailer` → raw nodemailer + handlebars
  - Circular dependency fix: `MailService` provided via `useFactory` (not class provider) to avoid NestJS DI cycle with custom factory providers
  - Templates pre-compiled at bootstrap via `readFileSync` + `compile()`
  - Removed 242 packages, vuln count 72 → 22 (remaining are all dev/test deps or unfixable multer)
- **Vulnerability fixes**: `@nestjs/swagger` ^11.4.1 → ^11.4.4 (drops lodash + path-to-regexp), uuid overrides ^10→^11
- **Bug fix**: `admin-auth.middleware.ts` used `JWT_SECRET` env var but auth module signs with `JWT_ACCESS_SECRET` — fixed

### Key decisions
- One-shot backend test pattern per AGENTS.md: start → test → kill immediately
- Bull Board JWT auth must match the same env var as NestJS `JwtModule` config
- `ConfigModule` removed from `MailModule` imports (it's already `isGlobal: true` in AppModule) — redundant import caused circular dependency

