import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CourseService } from '../../../core/services/courses.service';
import { EnrollmentService, EnrollmentResponse } from '../../../core/services/enrollment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Course } from '../../../core/models/course-model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-course-detail',
  imports: [RouterLink],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css',
})
export class CourseDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  ////// signals /////////
  course = signal<Course | null>(null);
  enrollment = signal<EnrollmentResponse | null>(null);
  loading = signal(true);
  enrolling = signal(false);
  error = signal<string | null>(null);
  expandedSections = signal<Set<string>>(new Set());

  ////// computed properties /////////
  isEnrolled = computed(() => this.enrollment() !== null);
  isFree = computed(() => (this.course()?.price ?? 1) === 0);

  totalLessons = computed(() => {
    const sections = this.course()?.sections ?? [];
    return sections.reduce((total, s) => total + s.lessons.length, 0);
  });

  totalDuration = computed(() => {
    const sections = this.course()?.sections ?? [];
    return sections.reduce((total, s) => {
      return total + s.lessons.reduce((sum, l) => sum + l.duration_seconds, 0);
    }, 0);
  });

  firstLessonId = computed(() => {
    const sections = this.course()?.sections ?? [];
    return sections[0]?.lessons[0]?.id ?? null;
  });

  starStates = computed(() => {
    const rating = Math.round(this.course()?.rating ?? 0);
    return [1, 2, 3, 4, 5].map((i) => i <= rating);
  });

  ngOnInit() {
    this.route.params
      .pipe(
        switchMap((params) => this.courseService.getCourseById(params['id'])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.course.set(response);
          this.loading.set(false);
          this.checkEnrollment(response.id);
        },
        error: () => {
          this.error.set('Unable to load course details.');
          this.loading.set(false);
        },
      });
  }

  private checkEnrollment(courseId: string) {
    console.log('[checkEnrollment] isLoggedIn:', this.authService.isLoggedIn());
    console.log('[checkEnrollment] userId:', this.authService.userId());
    if (!this.authService.isLoggedIn()) return;
    console.log('[checkEnrollment] courseId:', courseId);
    this.enrollment.set(null);
    this.enrollmentService.getMyEnrollment(courseId).subscribe({
      next: (enrollment) => {
        console.log('[checkEnrollment] enrollment ricevuto:', enrollment);
        this.enrollment.set(enrollment);
      },
      error: (err) => {
        console.log('[checkEnrollment] errore:', err);
        this.enrollment.set(null);
      },
    });
  }

  enroll() {
    const userId = this.authService.userId();
    const courseId = this.course()?.id;
    if (!userId || !courseId || this.enrolling()) return;

    this.enrolling.set(true);
    this.enrollmentService.enroll(userId, courseId).subscribe({
      next: (enrollment) => {
        this.enrollment.set(enrollment);
        this.enrolling.set(false);
      },
      error: () => {
        this.error.set('Enrollment failed. Please try again.');
        this.enrolling.set(false);
      },
    });
  }

  navigateToLesson(lessonId: string) {
    const enrollmentId = this.enrollment()?.id;
    if (!enrollmentId) return;
    this.router.navigate(['/enrollments', enrollmentId, 'lessons', lessonId]);
  }

  toggleSection(id: string) {
    const next = new Set(this.expandedSections());
    next.has(id) ? next.delete(id) : next.add(id);
    this.expandedSections.set(next);
  }

  isSectionExpanded(id: string): boolean {
    return this.expandedSections().has(id);
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h 00min`;
    return `${mins} min`;
  }
}
