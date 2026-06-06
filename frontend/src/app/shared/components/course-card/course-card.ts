import { Component, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Course } from '../../../core/models/course-model';

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
