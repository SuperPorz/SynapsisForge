# Session 44 — Day 97: Backend integration tests — endpoints

**Date**: 2026-06-29  
**Phase**: 9 — Testing & Security  
**Status**: Day 97 ✅

---

## Completed

### Day 97: Backend integration tests — endpoints

#### Files created
- `test/helpers.ts` — shared `createTestApp()` helper that applies global interceptors (`ClassSerializerInterceptor`, `LoggingInterceptor`, `TimeoutInterceptor`, `TransformInterceptor`), `ValidationPipe` (whitelist + transform + forbidNonWhitelisted), and `HttpExceptionFilter` — reusable across all e2e test suites
- `test/auth.e2e-spec.ts` — 2 tests:
  - `POST /auth/login` with valid credentials → 201 + `accessToken`
  - `POST /auth/login` with invalid credentials → 401 with error message
  - Uses `AuthController` + mock `AuthService`/`JwtService`/`ConfigService` (module-based providers, no imports)
- `test/courses-auth.e2e-spec.ts` — 4 tests:
  - `GET /courses` as public endpoint → 200 (unauthenticated)
  - `POST /courses` unauthenticated → 401
  - `POST /courses` as student → 403 Forbidden
  - `POST /courses` as instructor → 201 + service call verification
  - Uses `CoursesController` + `CoursesService` with all repository mocks (providers-based, no module imports)

#### Key pattern: TestAuthGuard
- Created a `TestAuthGuard` (implements `CanActivate`) that simulates both `JwtAuthGuard` + `RolesGuard` without requiring Passport
- Checks `@Public()` decorator first — skips auth if public
- Reads `req.user` set by Express middleware — returns `401` if missing
- Reads `@Roles()` decorator — returns `403` if role doesn't match
- Middleware uses a mutable `currentUser` variable to vary roles between tests

#### Results
- 8 new e2e tests across 3 suites (auth, courses-auth, health) — all passing
- 62 existing unit tests — all passing
- Pre-existing failures in `app.e2e-spec.ts` (Braintree env vars), `courses.e2e-spec.ts` and `enrollments.e2e-spec.ts` (TypeORM DataSource missing in standalone module imports) — unaffected

## Notes
- NestJS test module with `imports: [SomeModule]` does NOT make the root test module's `providers` available to the imported module's providers. To provide mocks for `CACHE_MANAGER`, `CacheService`, etc., use providers-based approach (`controllers: [X]`, `providers: [XService, ...]`) instead of importing the module.
- The `login` endpoint returns 201 (default POST status) because `@Res({ passthrough: true })` skips NestJS automatic status code management.
