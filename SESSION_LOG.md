# SESSION_LOG.md — Session log

> Format: each session prepends a new dated block. Never delete previous blocks.

---

## Session 2026-06-22 — Persistent quiz implementation

### Planned tasks
- [ ] **Bug 1**: `lessons.service.ts` — `updateLessonProgress` does not set `completed: true` on the MongoDB document
- [ ] **Bug 2**: `enrollments.service.ts` — `countDocuments` counts ALL progress docs, not just completed ones
- [ ] **Feature 1**: Add `quizAnswers` field to `LessonProgress` MongoDB schema
- [ ] **Feature 2**: Add `quizAnswers` to `UpdateLessonProgressDto`
- [ ] **Feature 3**: Return `quizAnswers` from `getVideoUrl()` response
- [ ] **Feature 4**: Save `quizAnswers` in `updateLessonProgress()`
- [ ] **Feature 5**: Frontend models — `QuizAnswer` interface, fields in `LessonVideoResponse` and `UpdateProgressPayload`
- [ ] **Feature 6**: QuizPlayer — per-question persistent state, init from `initialAnswers`, "← Previous" navigation button, `answersChanged` output
- [ ] **Feature 7**: LessonPlayer — pass quizAnswers, save via API on each answer ("next" click)

### Pre-session state
- ✅ QuizPlayer: immediate feedback, progress bar, animation
- ✅ QuizPlayer: "Next question →" / "Complete lesson" button
- ✅ LessonPlayer: QuizPlayer integration, `onQuizCompleted()`, `checkCourseCompletion()`
- ✅ Congratulations modal with link to `/profile/my-certificates`
- ❌ QuizPlayer: no "Previous" button
- ❌ QuizPlayer: answers lost when navigating between questions
- ❌ `PATCH .../progress`: `completed: true` never saved to MongoDB
- ❌ `enrollments.service.updateProgress`: wrong count (includes non-completed)
- ❌ No quiz answer persistence (frontend nor backend)

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
