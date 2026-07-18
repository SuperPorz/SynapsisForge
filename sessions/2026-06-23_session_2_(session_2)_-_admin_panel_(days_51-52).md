# Session 2026-06-23 (session 2) — Admin panel (Days 51-52)

### Backend changes
- Added `GET /admin/courses/pending` endpoint to `admin.controller.ts` returning all PENDING courses with instructor and category relations
- Added `findPendingCourses()` method to `admin.service.ts` with nested `['instructor', 'instructor.user', 'category']` relations

### Frontend changes
- Created `admin.service.ts` with methods: `getUsers()`, `getPendingCourses()`, `approveCourse()`, `rejectCourse()`, `getStats()`
- Added `roleGuard` with `['ADMIN']` to `/admin` route in `app.routes.ts`
- Built full admin component with 3 tabs:
  - **Dashboard**: 4 KPI cards (total users, instructors, students, published courses), doughnut chart (users by role), line chart (revenue YTD), recent activity feed
  - **Users**: Table with avatar/initials, name, email, role badge (colored per role), active/inactive status indicator; filters by role and active status
  - **Course Moderation**: Pending courses cards with thumbnail, title, description, instructor name, price, date; Approve/Reject buttons that remove from list on action
- Navbar: added "Admin" link visible only for ADMIN users
- Dashboard sidebar + mobile overlay: added "Admin panel" link in Admin section for ADMIN users

### Verification
- Backend `npx nest build` — ✅
- Frontend `ng build --configuration production` — ✅ (pre-existing warnings only)

---

