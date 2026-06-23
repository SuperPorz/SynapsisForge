import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { EnrollmentService, EnrollmentResponse, ActivityItem } from '../../../core/services/enrollment.service';

@Component({
  selector: 'app-my-enrolls',
  imports: [RouterLink, DatePipe],
  templateUrl: './my-enrolls.html',
  styleUrl: './my-enrolls.css',
})
export class MyEnrolls implements OnInit {
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
