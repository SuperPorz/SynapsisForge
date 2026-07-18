# Session 80 — Mobile Auth Endpoints

**Date**: 2026-07-17
**Phase**: Phase 10 — Additional (Post-retrospective)
**Focus**: Implement mobile-friendly auth endpoints with refresh token reuse detection

---

## Summary

Implemented a new `AuthMobileController` with 5 endpoints designed for mobile clients (no httpOnly cookies — tokens returned in body + header-based refresh). Discovered and fixed a critical bcrypt 72-byte truncation bug during implementation.

## Completed

### New files
- `backend/src/modules/auth/auth-mobile.controller.ts` — 5 endpoints

### Modified files
- `backend/src/modules/auth/auth.service.ts` — added `hashToken()`, `verifyToken()`, `refreshTokensMobile()`, `redisGet/set/del`, `onModuleDestroy`
- `backend/src/modules/auth/auth.controller.ts` — `decode()` → `verifyAsync()` for web refresh
- `backend/src/modules/auth/auth.module.ts` — registered `AuthMobileController`
- `backend/src/modules/auth/auth.service.spec.ts` — updated tests
- `backend/package.json` — added `@redis/client`, replaced `bcrypt` with `bcryptjs`
- `backend/package-lock.json` — updated
- `backend/src/database/seeds/users.seed.ts` — import `bcrypt` → `bcryptjs`
- `.gitignore` — added `CONTEXT.md`

### Key technical decisions

1. **SHA-256 + bcrypt**: Fixes bcrypt 72-byte truncation. Refresh JWTs differ after ~85 chars (jti at end of payload). SHA-256 condenses to 64 hex chars before bcrypt.
2. **Direct Redis client for mobile**: `refreshTokensMobile()` uses raw `@redis/client` to bypass cache-manager's Keyv in-memory layer, ensuring immediate consistency for reuse detection.
3. **`verifyAsync()`**: Both mobile and web refresh endpoints now use `jwtService.verifyAsync()` instead of `decode()` to verify JWT signature and expiry.
4. **`bcryptjs`**: Replaced `bcrypt` (native binary, required node-gyp/MSVS) with `bcryptjs` (pure JS) — same API, no compilation needed.

### CURL test results (all ✅)
- `POST /auth/mobile/register` → 201
- `POST /auth/mobile/login` → 201 with `{ accessToken, refreshToken }`
- `GET /users/me` with Bearer → 200
- `POST /auth/mobile/refresh` with `X-Refresh-Token` → 201 (rotation)
- **Reuse old RT** → 401 "Sessione terminata per sicurezza"
- Refresh after reuse → 401 "Sessione scaduta" (Redis key nuked)
- **Expired access token** → 401 "Unauthorized"
- `POST /auth/mobile/logout` + refresh after → 401

## Blocked
- (none)
