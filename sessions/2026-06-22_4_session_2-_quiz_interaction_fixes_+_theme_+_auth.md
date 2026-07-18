# Session 2026-06-22 — Session 2: Quiz interaction fixes + theme + auth

### Tasks completed ✅
- [x] **Zoneless CD fix**: `selectAnswer()` now calls `emitAnswers()` immediately → parent marks dirty → `tick()` reaches QuizPlayer → UI updates
- [x] **Backend 500 fix**: `progress.toObject()` + plain array mapping to avoid class-transformer circular refs on Mongoose documents
- [x] **Missing Tailwind v4 `@theme`**: Added `@theme { ... }` block in `styles.css` — all custom colors (`fg-brand`, `surface-alt`, etc.) were undefined, causing elements with those classes to render transparent/invisible
- [x] **Sidebar checkmark fix**: Replaced stale `activeLessonId()` template references (removed computed) with `lessonId()`
- [x] **Console logs restored**: `[saveProgress]` logs back after accidental removal
- [x] **"Lezione successiva →"**: Changed from "Completa lezione" + `navigateToNextLesson()` added
- [x] **JWT expiry**: Increased from `15m` to `2h` in `backend/.env`
- [x] **AGENTS.md rules**: Added service management policy — user always starts frontend/backend manually

### Key discoveries
- Missing `@theme` block caused all custom Tailwind v4 colors to not render (root cause of button "disappearing")
- Stale `activeLessonId()` refs in template caused sidebar rendering errors (green checkmark not appearing)

