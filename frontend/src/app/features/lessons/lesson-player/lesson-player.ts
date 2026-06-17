//prettier-ignore
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal, computed, } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { throttleTime, takeUntil } from 'rxjs/operators';
import { LessonsService } from '../../../core/services/lessons.service';
import { Lesson, LessonVideoResponse, Section } from '../../../core/models/course-model';

@Component({
  selector: 'app-lesson-player',
  standalone: true,
  imports: [RouterLink],
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

  // ── derived signals ───────────────────────────────────────────────────────
  // activeLessonId è derivato dal lessonId del route, non da currentLesson,
  // così la sidebar si evidenzia immediatamente al click senza aspettare HTTP
  activeLessonId = computed(() => this.lessonId());

  // ── RxJS cleanup ──────────────────────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();
  private timeupdateSub?: Subscription;

  // ── posizione salvata più di recente (per evitare chiamate ridondanti) ────
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

    this.lessonsService
      .getVideoUrl(this.enrollmentId(), this.lessonId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: LessonVideoResponse) => {
          this.videoUrl.set(res.videoUrl);
          this.sections.set(res.sections);
          this.completedLessonIds.set(res.completedLessonIds);

          // currentLesson: cerchiamo la lezione corrente nelle sezioni
          const found =
            res.sections.flatMap((s) => s.lessons).find((l) => l.id === this.lessonId()) ?? null;
          this.currentLesson.set(found);

          this.loading.set(false);

          // aggancia il listener timeupdate dopo che il DOM è pronto
          // setTimeout 0 garantisce che @ViewChild sia risolto
          setTimeout(() => this.attachTimeupdateListener(), 0);

          // seek alla posizione salvata se > 0
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

    // salva la posizione ogni 10s — throttleTime ignora gli eventi intermedi
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

    // aggiorna localmente completedLessonIds per riflettere lo stato in sidebar
    // senza dover fare un nuovo GET
    if (!this.completedLessonIds().includes(this.lessonId())) {
      this.completedLessonIds.update((ids) => [...ids, this.lessonId()]);
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
      .subscribe();
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

// enrollment di alice
// 163eb40f-d8ff-4abf-b50a-6672b052cdd2
