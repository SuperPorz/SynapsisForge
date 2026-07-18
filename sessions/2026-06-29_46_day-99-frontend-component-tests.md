# Session 46 — Day 99: Frontend unit tests — components

**Date**: 2026-06-29
**Phase**: 9 — Testing & Security
**Status**: Day 99 ✅

---

## Completed

### Day 99: Frontend unit tests — components

#### Files updated
- `frontend/angular.json` — removed `codeCoverage`/`codeCoverageThreshold` options from `@angular/build:unit-test` (not supported by Vitest builder)

#### Files created
- `frontend/src/app/shared/components/course-card/course-card.spec.ts` — 10 tests:
  - Component creation, rendering (title, instructor, price)
  - Premium "Included" badge display
  - Enrolled "Go to course" button
  - "In cart" disabled button state
  - "Add to cart" button visibility
  - `addToCart()` calls `cart.addItem()`
  - `starStates` computed signal based on rounded rating
  - "Unrated" badge when rating is null

- `frontend/src/app/features/auth/login/login.spec.ts` — 13 tests:
  - Component creation, form invalid when empty
  - Email validation (invalid format → error, valid → passes)
  - Password minlength validation
  - Form validity when both fields correct
  - `onSubmit()` calls `authService.login()` with correct payload
  - Form invalid → `onSubmit()` does nothing
  - Submit button disabled/enabled with form validity
  - Error messages displayed on touched+invalid (email, password)
  - `registered` query param sets `registered=true` + shows success banner
  - `verified` query param sets `verified=true` + shows success banner
  - Uses `ActivatedRoute` mock for query param testing

- `frontend/src/app/core/guards/auth-guard.spec.ts` — 2 tests:
  - Returns `true` when `isLoggedIn()` returns true
  - Returns URL tree to `/login` when not logged in
  - Uses `TestBed.runInInjectionContext()` for functional guard

#### Results
- 56 frontend tests passing (+23 new) across 34 test files
- 85 backend unit tests still passing

## Notes
- Frontend uses `@angular/build:unit-test` (Vitest) without custom config files
- `vi.fn()` used for all mocks (Vitest API, not Jest)
- `ActivatedRoute` must be explicitly provided in TestBed for query param tests
- Functional guards (`CanActivateFn`) tested via `TestBed.runInInjectionContext()`
