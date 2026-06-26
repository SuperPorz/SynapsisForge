import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PresignedUrlResponse, LessonVideoResponse, UpdateProgressPayload } from '../models/course-model';
import { environment } from '../../../environments/environment.develop';

@Injectable({ providedIn: 'root' })
export class LessonsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getVideoUrl(enrollmentId: string, lessonId: string): Observable<LessonVideoResponse> {
    return this.http.get<LessonVideoResponse>(
      `${this.base}/enrollments/${enrollmentId}/lessons/${lessonId}/video`,
    );
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

  getPresignedUrl(fileName: string, contentType: string): Observable<PresignedUrlResponse> {
    return this.http.post<PresignedUrlResponse>(`${this.base}/uploads/presigned-url`, {
      fileName,
      contentType,
    });
  }

  updateS3Key(courseId: string, lessonId: string, s3Key: string): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/courses/${courseId}/lessons/${lessonId}/s3-key`,
      { s3Key },
    );
  }
}
