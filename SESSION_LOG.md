# SESSION_LOG.md — Session log

> Format: each session prepends a new dated block. Never delete previous blocks.

---

## Session 2026-06-22 — Pre-48.1 refinements (category slugs, logo, agentic file rules)

### Tasks completed ✅
- [x] **Category filter fix**: Backend changed from `category.name = :category` to `category.slug = :category` so the filter works with URL-friendly slugs
- [x] **Real category slugs**: Updated `categories.ts` with actual DB seed slugs (`web-development`, `data-science`, `ui-ux-design`, `mobile-development`)
- [x] **Logo enlargement**: `h-9` → `h-14`, navbar height `h-16` → `h-20`
- [x] **Navbar text sizes**: All nav links and auth buttons increased from `text-sm` to `text-base`
- [x] **Agentic file rule refactoring**:
  - Removed bug-fix/cleanup items from `PLAN.md` (moved to `SESSION_LOG.md` / `MEMORY.md`)
  - `PLAN.md` now contains ONLY development/design tasks that map to `actual_plan.txt`
  - `AGENTS.md` rules updated: bug fixes never go into PLAN, only into SESSION_LOG/MEMORY
  - `TODO.md` cleaned: Pre-sprint section removed, only Day 48 tasks remain
- [x] **Commit agentic file changes**

### Notes
- Real category slugs found in `backend/src/database/seeds/categories.seed.ts`
- `actual_plan.txt` added to repo root as immutable source of truth

---

## Session 2026-06-22 — Persistent quiz implementation

### Tasks completed ✅
- [x] **Bug 1**: `lessons.service.ts` — `updateLessonProgress` does not set `completed: true` on the MongoDB document
- [x] **Bug 2**: `enrollments.service.ts` — `countDocuments` counts ALL progress docs, not just completed ones
- [x] **Feature 1**: Add `quizAnswers` field to `LessonProgress` MongoDB schema
- [x] **Feature 2**: Add `quizAnswers` to `UpdateLessonProgressDto`
- [x] **Feature 3**: Return `quizAnswers` from `getVideoUrl()` response
- [x] **Feature 4**: Save `quizAnswers` in `updateLessonProgress()`
- [x] **Feature 5**: Frontend models — `QuizAnswer` interface, fields in `LessonVideoResponse` and `UpdateProgressPayload`
- [x] **Feature 6**: QuizPlayer — per-question persistent state, init from `initialAnswers`, "← Previous" navigation button, `answersChanged` output
- [x] **Feature 7**: LessonPlayer — pass quizAnswers, save via API on each answer ("next" click)

### Post-session state
- ✅ QuizPlayer: immediate feedback, progress bar, animation
- ✅ QuizPlayer: "Next question →" / "Complete lesson" button
- ✅ QuizPlayer: "← Previous" button
- ✅ QuizPlayer: per-question state persistence, init from API answers
- ✅ LessonPlayer: QuizPlayer integration, `onQuizCompleted()`, `checkCourseCompletion()`
- ✅ Congratulations modal with link to `/profile/my-certificates`
- ✅ `PATCH .../progress`: `completed: true` correctly saved to MongoDB
- ✅ `enrollments.service.updateProgress`: counts only completed lessons
- ✅ Quiz answer persistence via API (saved on each "next" click)
- ✅ `onVideoEnded()` no longer marks quiz lessons as completed
- ✅ QuizPlayer effect no longer resets on `answersChanged` (untracked fix)

### Bugs found & fixed during session
- **QuizPlayer effect loop**: effect tracked `initialAnswers()` — every `answersChanged` event from QuizPlayer updated the parent's `quizAnswers` signal, which re-triggered the effect, resetting to question 0. Fixed with `effect(..., { untracked: true })` using Angular's `untracked()`.
- **onVideoEnded() wrongly completing quiz lessons**: `saveProgress(position, true)` and `completedLessonIds.update()` ran unconditionally. Now only non-quiz lessons get completed on video end.

### Decisions made
- Store quiz answers in a `quizAnswers` field on the existing `LessonProgress` document (same collection as video progress — no new collection)
- `QuizAnswer` format: `{ questionIndex: number, selectedLabel: string, correct: boolean }`
- Save via API on each "Next question" click (not on every answer selection)
- Frontend: QuizPlayer maintains `answeredQuestions: Record<number, QuizAnswer>` signal
- `getVideoUrl()` returns `quizAnswers` to restore state when re-entering a lesson
- `UpdateLessonProgressDto` needs `@ValidateNested()` for nested arrays

### Notes
- `/profile/my-certificates` route is not yet implemented (placeholder for future)
- Need to verify `.env` file location and `USE_S3=false` setting

---

## Session 2026-06-22 — Session 2: Quiz interaction fixes + theme + auth

### Tasks completed ✅
- [x] **Zoneless CD fix**: `selectAnswer()` now calls `emitAnswers()` immediately → parent marks dirty → `tick()` reaches QuizPlayer → UI updates
- [x] **Backend 500 fix**: `progress.toObject()` + plain array mapping to avoid class-transformer circular refs on Mongoose documents
- [x] **Missing Tailwind v4 `@theme`**: Added `@theme { ... }` block in `styles.css` — all custom colors (`fg-brand`, `surface-alt`, etc.) were undefined, causing elements with those classes to render transparent/invisible
- [x] **Sidebar checkmark fix**: Replaced stale `activeLessonId()` template references (removed computed) with `lessonId()`
- [x] **Console logs restored**: `[saveProgress]` logs back after accidental removal
- [x] **"Lezione successiva →"**: Changed from "Completa lezione" + `navigateToNextLesson()` added
- [x] **JWT expiry**: Increased from `15m` to `2h` in `backend/.env`
- [x] **AGENT.md rules**: Added service management policy — user always starts frontend/backend manually

### Key discoveries
- Missing `@theme` block caused all custom Tailwind v4 colors to not render (root cause of button "disappearing")
- Stale `activeLessonId()` refs in template caused sidebar rendering errors (green checkmark not appearing)
