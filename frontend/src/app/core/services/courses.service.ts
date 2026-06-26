import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.develop';
import { Course, PaginatedCoursesResponse } from '../models/course-model';
import { Category } from '../models/category-model';

export interface CreateCoursePayload {
  title: string;
  slug: string;
  description: string;
  price: number;
  category_id: string;
  thumbnail_url: string;
  status?: string;
}

export interface CreateSectionPayload {
  title: string;
  order?: number;
}

export interface CreateLessonPayload {
  title: string;
  order: number;
  duration_seconds?: number;
  section_id?: string;
}

export interface CreateLessonContentPayload {
  videoUrl: string;
  transcript?: string | null;
  quiz?: QuizItemPayload[];
}

export interface QuizItemPayload {
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation?: string | null;
}

export interface SectionResponse {
  id: string;
  title: string;
  order: number;
  lessons?: LessonResponse[];
}

export interface LessonResponse {
  id: string;
  title: string;
  order: number;
  duration_seconds: number;
  section_id?: string;
}

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
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    limit: number;
  }): Observable<PaginatedCoursesResponse> {
    let params = new HttpParams().set('page', filters.page).set('limit', filters.limit);

    if (filters.featured !== undefined) params = params.set('featured', filters.featured);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.q) params = params.set('q', filters.q);
    if (filters.minPrice !== undefined) params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice);

    return this.http.get<PaginatedCoursesResponse>(`${this.API}/courses`, { params });
  }

  searchFilter(filters: {
    q?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Observable<PaginatedCoursesResponse> {
    let params = new HttpParams();

    if (filters.q) params = params.set('q', filters.q);
    if (filters.minPrice !== undefined) params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice);

    return this.http.get<PaginatedCoursesResponse>(`${this.API}/courses/search/filter`, { params });
  }

  search(query: string): Observable<PaginatedCoursesResponse> {
    return this.http.get<PaginatedCoursesResponse>(`${this.API}/courses/search?q=${query}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.API}/courses/categories`);
  }

  getMyCourses(): Observable<InstructorCourse[]> {
    return this.http.get<InstructorCourse[]>(`${this.API}/courses/my`);
  }

  getCourseStats(courseId: string): Observable<CourseStats> {
    return this.http.get<CourseStats>(`${this.API}/courses/my/stats/${courseId}`);
  }

  getCourseLessonsWithStats(courseId: string): Observable<LessonStats[]> {
    return this.http.get<LessonStats[]>(`${this.API}/courses/my/${courseId}/lessons`);
  }

  createCourse(payload: CreateCoursePayload): Observable<Course> {
    return this.http.post<Course>(`${this.API}/courses`, payload);
  }

  updateCourse(id: string, payload: Partial<CreateCoursePayload>): Observable<Course> {
    return this.http.patch<Course>(`${this.API}/courses/${id}`, payload);
  }

  createSection(courseId: string, payload: CreateSectionPayload): Observable<SectionResponse> {
    return this.http.post<SectionResponse>(`${this.API}/courses/${courseId}/sections`, payload);
  }

  updateSection(courseId: string, sectionId: string, payload: Partial<CreateSectionPayload>): Observable<SectionResponse> {
    return this.http.patch<SectionResponse>(`${this.API}/courses/${courseId}/sections/${sectionId}`, payload);
  }

  deleteSection(courseId: string, sectionId: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/courses/${courseId}/sections/${sectionId}`);
  }

  reorderSections(courseId: string, sectionIds: string[]): Observable<SectionResponse[]> {
    return this.http.patch<SectionResponse[]>(`${this.API}/courses/${courseId}/sections/reorder`, { sectionIds });
  }

  createLesson(courseId: string, payload: CreateLessonPayload): Observable<LessonResponse> {
    return this.http.post<LessonResponse>(`${this.API}/courses/${courseId}/lessons`, payload);
  }

  updateLesson(courseId: string, lessonId: string, payload: Partial<CreateLessonPayload>): Observable<LessonResponse> {
    return this.http.patch<LessonResponse>(`${this.API}/courses/${courseId}/lessons/${lessonId}`, payload);
  }

  deleteLesson(courseId: string, lessonId: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/courses/${courseId}/lessons/${lessonId}`);
  }

  createLessonContent(courseId: string, lessonId: string, payload: CreateLessonContentPayload): Observable<unknown> {
    return this.http.post(`${this.API}/courses/${courseId}/lessons/${lessonId}/content`, payload);
  }

  updateLessonContent(courseId: string, lessonId: string, payload: Partial<CreateLessonContentPayload>): Observable<unknown> {
    return this.http.patch(`${this.API}/courses/${courseId}/lessons/${lessonId}/content`, payload);
  }

  deleteCourse(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/courses/${id}`);
  }
}

export interface InstructorCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: string;
  thumbnail_url: string;
  category: string | null;
  enrollmentCount: number;
  rating: number | null;
  created_at: string;
}

export interface CourseStats {
  courseId: string;
  courseTitle: string;
  enrollmentCount: number;
  averageRating: number | null;
  totalWatchTimeSeconds: number;
}

export interface LessonStats {
  lessonId: string;
  lessonTitle: string;
  order: number;
  durationSeconds: number;
  totalWatchTimeSeconds: number;
  completionCount: number;
}
