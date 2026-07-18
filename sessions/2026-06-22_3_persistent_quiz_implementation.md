# Session 2026-06-22 — Persistent quiz implementation

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

