# Session 37 — Registration, OAuth, Email verification & Docker compose fixes

**Date**: 2026-06-27  
**State**: ✅ Complete

## Summary

Fixed three critical production bugs and added infrastructure improvements:

### 1. Standard Registration (Button did nothing)
- **Root cause**: `Register.onSubmit()` only did `console.log(payload)` — never called any service.
- **Fix**: Added `register()` method to `AuthService` + wired up `onSubmit()` to call it.
- **Files**:
  - `frontend/src/app/core/services/auth.service.ts` — Added `RegisterDto` interface, `register()` method
  - `frontend/src/app/features/auth/register/register.ts` — Wired up form submission to `authService.register()`
  - `frontend/src/app/features/auth/register/register.html` — Added error message display

### 2. OAuth Redirect (Broken after Google/GitHub login)
- **Root cause 1**: Backend hardcoded `http://localhost:4200/oauth-test.html` — `oauth-test.html` didn't exist.
- **Root cause 2**: `login.ts` and `register.ts` used `/api/auth/google` (hardcoded relative path) instead of `environment.apiUrl`.
- **Fix**: 
  - Backend now uses `FRONTEND_URL` from ConfigService for dynamic redirect
  - Sets `refresh_token` as httpOnly cookie before redirect
  - Redirects to `/oauth-callback?provider=google&accessToken=<token>`
  - Created proper `OAuthCallback` component to handle tokens
  - OAuth URLs now use `${environment.apiUrl}/auth/google`
- **Files**:
  - `backend/src/modules/auth/auth.controller.ts` — Inject `ConfigService`, dynamic redirect, cookie before redirect
  - `frontend/src/app/features/auth/oauth-callback/oauth-callback.ts` — New component
  - `frontend/src/app/features/auth/login/login.ts` — Use dynamic API URL
  - `frontend/src/app/features/auth/register/register.ts` — Use dynamic API URL
  - `frontend/src/app/app.routes.ts` — Added `/oauth-callback` route

### 3. Verification Email (Never sent)
- **Root cause**: `user.registered` event only triggered a welcome email, not a verification email. The `email_verification_token` was stored in DB but never sent to the user. No frontend `/verify-email/:token` route existed.
- **Fix**: 
  - Created `email-verification.hbs` template (purple brand, "Verify Email" CTA)
  - Added `sendVerificationEmail()` to `MailService`
  - Changed `EmailListener` to dispatch `send-verification-email` job (instead of welcome)
  - Added handler in `EmailQueueProcessor`
  - Pass `verificationToken` in the event payload from `AuthService.register()`
  - Created `VerifyEmail` frontend component
  - Added `/verify-email/:token` route
- **Files**:
  - `backend/src/modules/mail/templates/email-verification.hbs` — New template
  - `backend/src/modules/mail/mail.service.ts` — Added `sendVerificationEmail()`, `SendVerificationEmailInput`
  - `backend/src/modules/queues/email-listener.ts` — Changed to send verification email
  - `backend/src/modules/queues/email-queue.processor.ts` — Added handler
  - `backend/src/modules/auth/auth.service.ts` — Pass `verificationToken` in event payload
  - `frontend/src/app/features/auth/verify-email/verify-email.ts` — New component
  - `frontend/src/app/app.routes.ts` — Added `/verify-email/:token` route

### 4. Login success banners
- Added `registered` and `verified` query param handling in Login component
- Shows green success banners when redirected from registration or email verification

### 5. Docker compose update
- Set `name: synapsis` for the project
- Added `frontend` service (builds from frontend/Dockerfile, serves Angular on port 80)
- Added `nginx` reverse proxy service (port 8080 → 80) using `docker-nginx.conf`
- Nginx proxies `/api/` to backend, `/` to frontend
- Created `infra/nginx/docker-nginx.conf` for Docker networking

### 6. Cross-browser testing
- Created `infra/docker-compose.browsers.yaml` with Selenium Grid + VNC
- Browsers: Chrome, Firefox, Edge — each accessible via VNC on ports 5901-5903
- Instructions in the compose file header

## Key Configurations

### Environment variables needed for production:
- `FRONTEND_URL` must be set to `https://synapsisforge.shop` (or actual domain)
- `GOOGLE_CALLBACK_URL` must be `https://synapsisforge.shop/api/auth/google/callback` (with `/api` prefix because nginx strips it)
- `GITHUB_CALLBACK_URL` must be `https://synapsisforge.shop/api/auth/github/callback`
- SMTP must be configured for verification emails to work

### OAuth callback URL format (production):
The `GOOGLE_CALLBACK_URL` in `.env` must match what's registered in Google Cloud Console. The nginx strips the `/api` prefix when proxying to backend, so:
- Google Console: `https://synapsisforge.shop/api/auth/google/callback`
- Backend receives: `/auth/google/callback` (nginx strips `/api`)

## Files modified/created
- 12 files modified
- 5 new files created
