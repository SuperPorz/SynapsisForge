import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Course } from '../../../core/models/course-model';

@Component({
  selector: 'app-course-card',
  imports: [RouterLink],
  templateUrl: './course-card.html',
  styleUrl: './course-card.css',
})
export class CourseCard {
  course = input.required<Course>();

  starStates = computed(() => {
    const rating = Math.round(this.course()?.rating ?? 0);
    return [1, 2, 3, 4, 5].map((i) => i <= rating);
  });
}
