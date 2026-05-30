import { Component, input } from '@angular/core';
import { Course } from '../../../../core/models/course-model';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-course-card',
  imports: [RouterLink],
  templateUrl: './course-card.html',
  styleUrl: './course-card.css',
})
export class CourseCard {
  // Signal-based input (Angular 17+)
  course = input.required<Course>();
}
