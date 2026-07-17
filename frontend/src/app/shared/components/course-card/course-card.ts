import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Course } from '../../../core/models/course-model';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-course-card',
  imports: [RouterLink],
  templateUrl: './course-card.html',
  styleUrl: './course-card.css',
})
export class CourseCard {
  course = input.required<Course>();
  auth = inject(AuthService);
  cart = inject(CartService);
  enrollment = inject(EnrollmentService);
  private toast = inject(ToastService);

  starStates = computed(() => {
    const rating = Math.round(this.course()?.rating ?? 0);
    return [1, 2, 3, 4, 5].map((i) => i <= rating);
  });

  inCart = computed(() => this.cart.isInCart(this.course()?.id));
  isEnrolled = computed(() => this.enrollment.enrolledCourseIds().has(this.course()?.id));
  isFree = computed(() => (this.course()?.price ?? 1) === 0);

  adding = computed(() => this.cart.loading());
  enrolling = signal(false);

  addToCart() {
    const id = this.course()?.id;
    if (!id || this.inCart()) return;
    this.cart.addItem(id).subscribe();
  }

  enroll() {
    const userId = this.auth.userId();
    const courseId = this.course()?.id;
    if (!userId || !courseId || this.enrolling()) return;

    this.enrolling.set(true);
    this.enrollment.enroll(userId, courseId).subscribe({
      next: () => {
        this.enrolling.set(false);
        this.enrollment.loadEnrolledCourseIds();
        this.toast.show('Enrolled successfully!');
      },
      error: () => {
        this.enrolling.set(false);
        this.toast.show('Enrollment failed. Please try again.', 'error');
      },
    });
  }
}
