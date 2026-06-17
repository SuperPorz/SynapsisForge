import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.develop';
import { Course, PaginatedCoursesResponse, SearchCoursesResponse } from '../models/course-model';
import { Category } from '../models/category-model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  getCourseById(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.API}/courses/${id}`);
  }

  getCourses(filters: {
    featured?: boolean;
    category?: string;
    page: number;
    limit: number;
  }): Observable<PaginatedCoursesResponse> {
    let params = new HttpParams().set('page', filters.page).set('limit', filters.limit);

    if (filters.featured !== undefined) params = params.set('featured', filters.featured);
    if (filters.category) params = params.set('category', filters.category);

    return this.http.get<PaginatedCoursesResponse>(`${this.API}/courses`, { params });
  }

  searchFilter(filters: {
    q?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Observable<SearchCoursesResponse> {
    let params = new HttpParams();

    if (filters.q) params = params.set('q', filters.q);
    if (filters.minPrice !== undefined) params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice);

    return this.http.get<SearchCoursesResponse>(`${this.API}/courses/search/filter`, { params });
  }

  search(query: string): Observable<SearchCoursesResponse> {
    return this.http.get<SearchCoursesResponse>(`${this.API}/courses/search?q=${query}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.API}/courses/categories`);
  }
}
