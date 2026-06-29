import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export interface CreateReviewDto {
  enrollmentId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/reviews`;

  getCourseReviews(courseId: string): Observable<ReviewItem[]> {
    return this.http.get<ReviewItem[]>(`${this.API}/course/${courseId}`);
  }

  create(dto: CreateReviewDto): Observable<ReviewItem> {
    return this.http.post<ReviewItem>(this.API, dto);
  }

  update(id: string, dto: UpdateReviewDto): Observable<ReviewItem> {
    return this.http.patch<ReviewItem>(`${this.API}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
