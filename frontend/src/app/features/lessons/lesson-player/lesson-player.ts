//prettier-ignore
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { throttleTime, takeUntil } from 'rxjs/operators';
import { LessonsService } from '../../../core/services/lessons.service';
import { Lesson, LessonVideoResponse, Section, QuizItem } from '../../../core/models/course-model';
import { QuizPlayer } from './quiz-player/quiz-player';

@Component({
  selector: 'app-lesson-player',
  standalone: true,
  imports: [RouterLink, QuizPlayer],
  templateUrl: './lesson-player.html',
})
export class LessonPlayer implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lessonsService = inject(LessonsService);

  // ── riferimento al tag <video> nel template ──────────────────────────────
  @ViewChild('videoPlayer') videoPlayerRef!: ElementRef<HTMLVideoElement>;

  // ── route params ──────────────────────────────────────────────────────────
  private enrollmentId = signal('');
  private lessonId = signal('');

  // ── state signals ─────────────────────────────────────────────────────────
  loading = signal(true);
  error = signal<string | null>(null);
  videoUrl = signal<string | null>(null);
  sections = signal<Section[]>([]);
  completedLessonIds = signal<string[]>([]);
  currentLesson = signal<Lesson | null>(null);
  quiz = signal<QuizItem[]>([]);
  showCongratulations = signal(false);

  // ── derived signals ───────────────────────────────────────────────────────
  activeLessonId = computed(() => this.lessonId());

  // ── RxJS cleanup ──────────────────────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();
  private timeupdateSub?: Subscription;

  // ── posizione salvata più di recente ─────────────────────────────────────
  private lastSavedPosition = 0;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.enrollmentId.set(params.get('enrollmentId')!);
      this.lessonId.set(params.get('lessonId')!);
      this.loadLesson();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timeupdateSub?.unsubscribe();
  }

  // ── caricamento dati ──────────────────────────────────────────────────────
  private loadLesson(): void {
    this.timeupdateSub?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.showCongratulations.set(false);

    this.lessonsService
      .getVideoUrl(this.enrollmentId(), this.lessonId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: LessonVideoResponse) => {
          this.videoUrl.set(res.videoUrl);
          this.sections.set(res.sections);
          this.completedLessonIds.set(res.completedLessonIds);
          this.quiz.set(res.quiz ?? []);

          const found =
            res.sections.flatMap((s) => s.lessons).find((l) => l.id === this.lessonId()) ?? null;
          this.currentLesson.set(found);

          this.loading.set(false);

          setTimeout(() => this.attachTimeupdateListener(), 0);

          if (res.last_position_seconds > 0) {
            setTimeout(() => {
              if (this.videoPlayerRef?.nativeElement) {
                this.videoPlayerRef.nativeElement.currentTime = res.last_position_seconds;
              }
            }, 0);
          }
        },
        error: () => {
          this.error.set('Impossibile caricare la lezione. Riprova più tardi.');
          this.loading.set(false);
        },
      });
  }

  // ── throttle timeupdate via RxJS ──────────────────────────────────────────
  private attachTimeupdateListener(): void {
    const video = this.videoPlayerRef?.nativeElement;
    if (!video) return;

    this.timeupdateSub = fromEvent(video, 'timeupdate')
      .pipe(throttleTime(10_000), takeUntil(this.destroy$))
      .subscribe(() => {
        const position = Math.floor(video.currentTime);
        if (position === this.lastSavedPosition) return;
        this.lastSavedPosition = position;
        this.saveProgress(position, false);
      });
  }

  // ── evento video terminato ────────────────────────────────────────────────
  onVideoEnded(): void {
    const video = this.videoPlayerRef?.nativeElement;
    const position = video ? Math.floor(video.currentTime) : 0;
    this.saveProgress(position, true);

    if (!this.completedLessonIds().includes(this.lessonId())) {
      this.completedLessonIds.update((ids) => [...ids, this.lessonId()]);
    }

    // se non c'è quiz, il video stesso completa la lezione → controlla corso
    if (this.quiz().length === 0) {
      this.checkCourseCompletion();
    }
  }

  // ── completamento quiz ────────────────────────────────────────────────────
  onQuizCompleted(): void {
    const pos = this.videoPlayerRef?.nativeElement
      ? Math.floor(this.videoPlayerRef.nativeElement.currentTime)
      : 0;

    this.saveProgress(pos, true);

    if (!this.completedLessonIds().includes(this.lessonId())) {
      this.completedLessonIds.update((ids) => [...ids, this.lessonId()]);
    }

    this.checkCourseCompletion();
  }

  // ── controlla se il corso è completato al 100% ───────────────────────────
  private checkCourseCompletion(): void {
    const allLessonIds = this.sections()
      .flatMap((s) => s.lessons)
      .map((l) => l.id);

    const allCompleted = allLessonIds.every((id) => this.completedLessonIds().includes(id));

    if (allCompleted) {
      this.showCongratulations.set(true);
    }
  }

  // ── chiamata HTTP progresso ───────────────────────────────────────────────
  private saveProgress(positionSeconds: number, completed: boolean): void {
    this.lessonsService
      .updateProgress(this.enrollmentId(), this.lessonId(), {
        last_position_seconds: positionSeconds,
        completed,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => console.log('[saveProgress] ✅ OK', { positionSeconds, completed }),
        error: (err) => console.error('[saveProgress] ❌ ERRORE', err.status, err.error),
      });
  }

  // ── navigazione sidebar ───────────────────────────────────────────────────
  navigateToLesson(lessonId: string): void {
    if (lessonId === this.lessonId()) return;
    this.router.navigate(['/enrollments', this.enrollmentId(), 'lessons', lessonId]);
  }

  // ── helpers template ──────────────────────────────────────────────────────
  isCompleted(lessonId: string): boolean {
    return this.completedLessonIds().includes(lessonId);
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
