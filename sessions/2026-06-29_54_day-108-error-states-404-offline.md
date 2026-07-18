# Session 54 — Day 108: Error states & edge cases

**Date**: 2026-06-29

## Summary
Implemented error states and edge case handling: global error boundary, custom 404 page, PWA offline handling, and form error messages.

## Work Done
- **Global error handler (frontend)**: Created `GlobalErrorHandler` (ErrorHandler override) that catches uncaught exceptions, HTTP errors, and network errors — shows toast notifications. Registered in `app.config.ts`.
- **Mongoose exception filter (backend)**: Extended `HttpExceptionFilter.toHttpException()` to catch Mongoose `ValidationError` and `CastError` with proper 400 responses.
- **Custom 404 page**: Created `NotFound` component with branded UI (404 hero, message, back-to-home CTA). Wildcard route `**` → redirect to `/not-found`.
- **Offline handling**: Created `ConnectivityService` monitoring `online`/`offline` events. Yellow warning banner in `app.html`. Updated auth interceptor to wrap status 0 errors with user-friendly message.
- **Form error messages**: Fixed login component — replaced `console.error(err)` with signal-bound `errorMessage` displayed as red text below submit button.

## Key Decisions
- Extended existing `HttpExceptionFilter` instead of creating a separate Mongoose filter (cleaner, single catch-all).
- Offline banner uses simple `@if` in `app.html` rather than a separate component.
- 404 page is lazy-loaded via route, not eagerly bundled.

## Files Modified
- `frontend/src/app/core/services/global-error-handler.ts` (new)
- `frontend/src/app/app.config.ts`
- `frontend/src/app/features/not-found/not-found.ts` (new)
- `frontend/src/app/features/not-found/not-found.html` (new)
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/core/services/connectivity.service.ts` (new)
- `frontend/src/app/app.ts`
- `frontend/src/app/app.html`
- `frontend/src/app/core/interceptors/auth.interceptor.ts`
- `frontend/src/app/features/auth/login/login.ts`
- `frontend/src/app/features/auth/login/login.html`
- `backend/src/common/filters/http-exception.filter.ts`

## Verification
- `npm run test` (frontend): 155/155
- `npm run test` (backend): 85/85
- `npx ng build`: success
- `npm run lint` (backend): 0 errors
