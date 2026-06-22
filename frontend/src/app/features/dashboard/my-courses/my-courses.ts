import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { EnrollmentService, EnrollmentResponse, ActivityItem } from '../../../core/services/enrollment.service';

@Component({
  selector: 'app-my-courses',
  imports: [RouterLink, DatePipe],
  templateUrl: './my-courses.html',
  styleUrl: './my-courses.css',
})
export class MyCourses implements OnInit {
  private enrollmentService = inject(EnrollmentService);

  enrollments = signal<EnrollmentResponse[]>([]);
  activities = signal<ActivityItem[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.enrollmentService.getMyEnrollments().subscribe((data) => {
      this.enrollments.set(data);
      this.loading.set(false);
    });

    this.enrollmentService.getMyActivity().subscribe((data) => {
      this.activities.set(data);
    });
  }
}
