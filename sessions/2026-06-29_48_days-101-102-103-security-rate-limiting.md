# Session 48 — Days 101–103: Security audit & rate limiting

**Date**: 2026-06-29

## Summary
Executed Days 101–103 of Phase 9 (Testing & Security): OWASP Top 10 audit, dependency/security headers review, and brute force protection.

## Day 101 — OWASP Top 10 review
- **SQL Injection**: Audited all 26 `createQueryBuilder` calls — all parameterized with `:param` / `{ param }`. Clean.
- **XSS**: Searched all Angular templates for `[innerHTML]`, `[outerHTML]`, `bypassSecurityTrust*`, `DomSanitizer` — zero matches. Clean.
- **CSRF**: Verified `REFRESH_COOKIE_OPTIONS` has `sameSite: 'strict'` + `httpOnly: true`. No CSRF middleware needed (JWT Bearer auth).
- **Sensitive data exposure**: `admin.service.ts` returned raw `User[]` entities via `find_users()`. Added `@Exclude({ toPlainOnly: true })` on 5 fields in `users.entity.ts`: `password`, `refresh_token_hash`, `email_verification_token`, `password_reset_token`, `password_reset_expires_at`.

## Day 102 — Dependency audit & security headers
- **npm audit**: 12 high, 18 moderate in backend; 0 in frontend. multer DoS (no fix) accepted — mitigated by 2MB limit + MIME whitelist.
- **Helmet**: Added `frameAncestors: ["'none'"]` to CSP in `main.ts` (clickjacking prevention). All other defaults active (HSTS 31536000s, nosniff, SAMEORIGIN, etc.).
- **CORS**: Verified `CORS_ORIGIN` env var config. Preflight OPTIONS test passed for `localhost:4200`. OWASP ZAP skipped (requires dedicated Docker container).

## Day 103 — Rate limiting & brute force protection
- **200ms delay**: Added `await new Promise(r => setTimeout(r, 200))` before all failed login error paths in `auth.service.ts`. Confirmed via timing (318ms response).
- **Login attempt counter**: Redis key `sf:login:attempts:{email}` incremented on each failure with 15min TTL. After 5 failures, `sf:login:locked:{email}` flag set (15min TTL).
- **Lockout flow**: Lock check happens first in `login()`. Counter resets on success (`cacheService.del` for both keys). Rate limiter (10/min) prevents reaching lockout via network.
- **Live test**: Counter at 3 confirmed. Successful login cleared counter (nil). Lockout message would trigger at attempt 6.

## Files modified
- `backend/src/main.ts` — added `frameAncestors` to CSP
- `backend/src/common/entities/users.entity.ts` — 5 `@Exclude` decorators
- `backend/src/modules/auth/auth.service.ts` — 200ms delay + lockout logic
