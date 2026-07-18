# Session 45 — Day 98: Backend tests — guards & interceptors

**Date**: 2026-06-29
**Phase**: 9 — Testing & Security
**Status**: Day 98 ✅

---

## Completed

### Day 98: Backend tests — guards & interceptors

#### Files created
- `src/common/guards/roles.guard.spec.ts` — 5 tests:
  - `@Public()` bypass → returns true
  - No `@Roles()` decorator → returns true
  - Valid role matches → returns true
  - Invalid role blocked → returns false
  - No user on request → returns false
  - Uses Reflector mocking via `getAllAndOverride` for isPublic/roles metadata

- `src/common/interceptors/transform.interceptor.spec.ts` — 3 tests:
  - Object data wrapped with `{ data, statusCode, timestamp }`
  - Null data wrapped correctly
  - Array data wrapped correctly
  - Uses RxJS `of()` to simulate `CallHandler.handle()`

- `src/common/filters/http-exception.filter.spec.ts` — 7 tests:
  - NotFoundException → 404 with `{ statusCode, error, message, path }`
  - BadRequestException with array message
  - Unknown Error → 500 with `INTERNAL_SERVER_ERROR` (from `HttpStatus[500]`)
  - TypeORM `QueryFailedError` with code `23505` → 409 ConflictException
  - TypeORM `QueryFailedError` with non-unique code → 500 Database error
  - ConflictException string message
  - Uses `QueryFailedError` from typeorm (actual `instanceof` check)

- `src/common/pipes/parse-uuid.pipe.spec.ts` — 8 tests:
  - Valid lowercase UUID v4 passes
  - Valid uppercase UUID v4 passes
  - Non-UUID string throws BadRequestException
  - Empty string throws
  - UUID v1 (wrong variant) throws
  - Number value throws
  - Null throws
  - Object value throws

#### Results
- 85 unit tests passing (4 new suites, 23 new tests)
- Pre-existing e2e failures unchanged (Braintree env vars, DataSource issues)
- Build verified: `npm run test` all green

## Notes
- RolesGuard test pattern: Reflector is instantiated as a plain mock object with `getAllAndOverride` — no need for NestJS TestingModule since the guard has no DI other than Reflector.
- TransformInterceptor test pattern: mock `ExecutionContext.switchToHttp().getResponse()` returns `{ statusCode }`, mock `CallHandler.handle()` returns `of(data)`. Test subscribes to the Observable and asserts on `{ data, statusCode, timestamp }`.
- HttpExceptionFilter test pattern: uses `QueryFailedError` from typeorm for realistic instanceof checks. The filter's `console.error('[UnhandledError]', exception)` logs on unknown/TypeORM errors.
- ParseUuidPipe test pattern: pure unit without NestJS TestingModule — pipe has no dependencies. Tests 8 cases covering valid, invalid types, and boundary conditions.
