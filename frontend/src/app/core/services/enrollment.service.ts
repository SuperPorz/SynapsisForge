import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.develop';

export interface EnrollmentResponse {
  id: string;
  progress_percent: number;
  completed_at: string | null;
  enrolled_at: string;
  courseId: string;
  courseTitle?: string;
  courseSlug?: string;
  courseThumbnail?: string;
  firstLessonId?: string;
  studentId: string;
}

export interface ActivityItem {
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  courseId: string;
  completedAt: string;
}

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/enrollments`;

  getMyEnrollment(courseId: string): Observable<EnrollmentResponse | null> {
    return this.http.get<EnrollmentResponse | null>(`${this.baseUrl}/my`, {
      params: { courseId },
    });
  }

  getMyEnrollments(): Observable<EnrollmentResponse[]> {
    return this.http.get<EnrollmentResponse[]>(`${this.baseUrl}/my`);
  }

  getMyActivity(): Observable<ActivityItem[]> {
    return this.http.get<ActivityItem[]>(`${this.baseUrl}/my/activity`);
  }

  enroll(userId: string, courseId: string): Observable<EnrollmentResponse> {
    return this.http.post<EnrollmentResponse>(this.baseUrl, { userId, courseId });
  }
}
