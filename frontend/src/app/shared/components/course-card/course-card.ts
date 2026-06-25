import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Course } from '../../../core/models/course-model';
import { CartService } from '../../../core/services/cart.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';

@Component({
  selector: 'app-course-card',
  imports: [RouterLink],
  templateUrl: './course-card.html',
  styleUrl: './course-card.css',
})
export class CourseCard {
  course = input.required<Course>();
  cart = inject(CartService);
  enrollment = inject(EnrollmentService);

  starStates = computed(() => {
    const rating = Math.round(this.course()?.rating ?? 0);
    return [1, 2, 3, 4, 5].map((i) => i <= rating);
  });

  inCart = computed(() => this.cart.isInCart(this.course()?.id));
  isEnrolled = computed(() => this.enrollment.enrolledCourseIds().has(this.course()?.id));

  adding = computed(() => this.cart.loading());

  addToCart() {
    const id = this.course()?.id;
    if (!id || this.inCart()) return;
    this.cart.addItem(id).subscribe();
  }
}
