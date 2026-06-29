import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReviewsService, ReviewItem } from '../../../core/services/reviews.service';
import { AuthService } from '../../../core/services/auth.service';
import { EnrollmentResponse } from '../../../core/services/enrollment.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-review-section',
  imports: [FormsModule],
  templateUrl: './review-section.html',
})
export class ReviewSection implements OnInit {
  courseId = input.required<string>();
  enrollment = input<EnrollmentResponse | null>(null);

  private reviewsService = inject(ReviewsService);
  authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  reviews = signal<ReviewItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Form state
  showForm = signal(false);
  editingReviewId = signal<string | null>(null);
  formRating = signal<number>(5);
  formComment = signal<string>('');
  saving = signal(false);
  formError = signal<string | null>(null);

  currentUserId = computed(() => this.authService.userId());

  canReview = computed(() => {
    const e = this.enrollment();
    return e !== null && e.completed_at !== null;
  });

  ownReview = computed<ReviewItem | null>(() => {
    const uid = this.currentUserId();
    if (!uid) return null;
    return this.reviews().find((r) => r.userId === uid) ?? null;
  });

  hasReviewed = computed(() => this.ownReview() !== null);

  starStates(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map((i) => i <= rating);
  }

  ngOnInit() {
    this.loadReviews();
  }

  private loadReviews() {
    this.loading.set(true);
    this.error.set(null);
    this.reviewsService.getCourseReviews(this.courseId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        this.reviews.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load reviews.');
        this.loading.set(false);
      },
    });
  }

  openNewForm() {
    this.editingReviewId.set(null);
    this.formRating.set(5);
    this.formComment.set('');
    this.formError.set(null);
    this.showForm.set(true);
  }

  openEditForm() {
    const r = this.ownReview();
    if (!r) return;
    this.editingReviewId.set(r.id);
    this.formRating.set(r.rating);
    this.formComment.set(r.comment ?? '');
    this.formError.set(null);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingReviewId.set(null);
    this.formError.set(null);
  }

  setRating(n: number) {
    this.formRating.set(n);
  }

  submitForm() {
    const enrollment = this.enrollment();
    if (!enrollment) return;

    this.saving.set(true);
    this.formError.set(null);
    const comment = this.formComment().trim() || undefined;

    const editId = this.editingReviewId();
    if (editId) {
      this.reviewsService.update(editId, { rating: this.formRating(), comment }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.saving.set(false);
          this.showForm.set(false);
          this.loadReviews();
        },
        error: () => {
          this.formError.set('Failed to update review.');
          this.saving.set(false);
        },
      });
    } else {
      this.reviewsService.create({ enrollmentId: enrollment.id, rating: this.formRating(), comment }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.saving.set(false);
          this.showForm.set(false);
          this.loadReviews();
        },
        error: (err) => {
          this.formError.set(err.error?.message ?? 'Failed to submit review.');
          this.saving.set(false);
        },
      });
    }
  }

  deleteReview(id: string) {
    if (!confirm('Delete this review?')) return;
    this.reviewsService.delete(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.loadReviews(),
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
