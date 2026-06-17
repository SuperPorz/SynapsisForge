import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { LessonVideoResponse, UpdateProgressPayload } from '../models/course-model';
import { environment } from '../../../environments/environment.develop';

@Injectable({ providedIn: 'root' })
export class LessonsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getVideoUrl(enrollmentId: string, lessonId: string): Observable<LessonVideoResponse> {
    return this.http
      .get<{
        data: LessonVideoResponse;
      }>(`${this.base}/enrollments/${enrollmentId}/lessons/${lessonId}/video`)
      .pipe(map((res) => res.data));
  }

  updateProgress(
    enrollmentId: string,
    lessonId: string,
    payload: UpdateProgressPayload,
  ): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/enrollments/${enrollmentId}/lessons/${lessonId}/progress`,
      payload,
    );
  }
}
