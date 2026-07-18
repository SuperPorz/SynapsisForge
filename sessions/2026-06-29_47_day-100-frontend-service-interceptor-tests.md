# Session 47 — Day 100: Frontend unit tests — services & interceptors

**Date**: 2026-06-29
**Phase**: 9 — Testing & Security
**Status**: Day 100 ✅

---

## Completed

### Day 100: Frontend unit tests — services & interceptors

#### Files created
- `frontend/src/app/core/services/auth.service.spec.ts` — 23 tests:
  - Constructor hydration: hydrated from valid token, null when no token, null when expired, null when malformed
  - register(): POST /auth/register with correct URL, method, body
  - login(): POST /auth/login with `withCredentials`, saves token, updates signals
  - logout(): POST /auth/logout, clears session, handles error gracefully, navigates to /login
  - refresh(): POST /auth/refresh with `withCredentials`, saves token, updates signals
  - isLoggedIn(): true after login, false when no token, false when expired
  - hasRole(): true when matching, false when non-matching, false when not logged in
  - getToken(): returns from localStorage, null when empty
  - Signals: currentUser, isAuthenticated, role, plan, userId all reflect correct state
  - setPlan(): updates plan signal

- `frontend/src/app/core/interceptors/auth.interceptor.spec.ts` — 8 tests:
  - Auth route bypass: /auth/login and /auth/refresh not intercepted
  - Token injection: Bearer header added, pass-through when no token
  - 401 handling: refresh+retry, logout on refresh failure, non-401 pass-through
  - Concurrent 401s: single refresh for queued requests

- `frontend/src/app/core/services/courses.service.spec.ts` — 22 tests:
  - All CRUD methods: getCourseById, getCourses (with filters), searchFilter, search, getCategories, getMyCourses, getCourseStats, getCourseLessonsWithStats
  - All section/lesson/content methods: createSection, updateSection, deleteSection, reorderSections, createLesson, updateLesson, deleteLesson, createLessonContent, updateLessonContent
  - deleteCourse
  - HTTP method, URL, body, params verified via HttpTestingController

#### Results
- **109 frontend tests passing** (+53 new tests across 3 files)
- 37 test files, 0 failures
- Interceptor concurrent 401 test uses `delay(0)` + Promise-based async pattern

## Notes
- `localStorage` is unavailable in Node.js Vitest test runner → mocked via `vi.stubGlobal()`
- `TestBed.resetTestingModule()` works correctly when localStorage is mocked globally
- Class-based interceptors tested via direct instantiation (no TestBed needed)
- Vitest `done` callback conflicts with `TestContext` type → use `() => new Promise<void>(resolve => ...)` pattern instead
- `vi.fn().mockReturnValueOnce()` + `.mockReturnValue()` chain pattern for interceptor retry tests
