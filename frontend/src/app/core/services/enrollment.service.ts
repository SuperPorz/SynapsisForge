import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.develop';

export interface EnrollmentResponse {
  id: string;
  progress_percent: number;
  completed_at: Date | null;
  enrolled_at: Date;
  courseId: string;
  studentId: string;
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

  enroll(userId: string, courseId: string): Observable<EnrollmentResponse> {
    return this.http.post<EnrollmentResponse>(this.baseUrl, { userId, courseId });
  }
}
