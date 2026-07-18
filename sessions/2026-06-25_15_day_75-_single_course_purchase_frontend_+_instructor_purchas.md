# Session 2026-06-25 (15) — Day 75: Single course purchase frontend + INSTRUCTOR purchase fix ✅

### Completed
- **Toast system**: `ToastService` + `ToastComponent` created (auto-dismiss, success/error/info types, slide-up animation)
- **Checkout success redirect**: both single-course and cart checkout navigate immediately to `/dashboard/my-enrolls` with toast message
- **Loading spinner**: both pay buttons show spinner SVG + "Processing..." text while `paying()` is true
- **Error messages**: backend returns specific messages (declined, insufficient funds, etc.) — frontend already displays them via `error()` signal
- **INSTRUCTOR/ADMIN purchase fix**: 
  - Seed: admin and all instructors now get StudentProfile
  - `PaymentsService.checkout()`: auto-create StudentProfile if missing
  - `EnrollmentsService.enroll()`: auto-create StudentProfile if missing
- **Bug fix**: `CartItem` entity was missing from `data-source.ts` entities array (caused seed crash)
- DB reset + seed executed successfully
- Builds: both `ng build` and `npx nest build` pass clean

### Key decisions
- Toast system: `ToastService` manages a `signal<Toast | null>`, `ToastComponent` renders in `AppComponent` at fixed bottom-right
- Auto-create StudentProfile is done in both `PaymentsService` (defensive pre-checkout) and `EnrollmentsService` (defensive pre-enrollment) for double coverage
- Every user now always gets a StudentProfile at seed time (admin, instructors, students) — enrollment system already linked to StudentProfile

