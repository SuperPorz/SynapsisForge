# Session 2026-06-23 — Sidebar restructure: Student/Instructor blocks

### Tasks completed ✅
- [x] Navbar: Dashboard link changed from `/dashboard/my-courses` to generic `/dashboard`
- [x] Desktop sidebar: two distinct blocks with headers — "Student" (My courses, Certificates, Profile) and "Instructor" (Courses, Create course) separated by a visual divider
- [x] Instructor block hidden entirely when user is student-only (no locked/disabled state shown)
- [x] Mobile bottom nav: Italian text fixed → English ("Certificati" → "Certificates", "Profilo" → "Profile"), added Instructor tab when role allows
- [x] Mobile overlay sidebar: matching Student/Instructor block structure with English text
- [x] `ng build --configuration production` passes

### Decisions made
- Instructor block is completely hidden for students — no "locked" or disabled UI. Simpler and less confusing.
- The sidebar divider is a `border-t` on a `<div>` with `my-3` spacing, matching the Tailwind design system
- Mobile bottom nav has a 4th "Instructor" tab (cog icon) when the user has instructor/admin role
- Mobile overlay sidebar mirrors the desktop sidebar with full Student/Instructor block structure

---

