import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.develop';

export interface AdminUser {
  id: string;
  email: string | null;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  isVerified: boolean;
  avatar_url: string | null;
  bio: string | null;
  created_at?: string;
}

export interface PendingCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: string;
  thumbnail_url?: string;
  instructor?: { id: string; user?: { first_name: string; last_name: string; email: string } };
  category?: { id: string; name: string };
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  users_by_role: { role: string; count: number }[];
  published_courses: number;
  monthly_revenue: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  getUsers(filters?: { role?: string; is_active?: boolean }): Observable<AdminUser[]> {
    let params = new HttpParams();
    if (filters?.role) params = params.set('role', filters.role);
    if (filters?.is_active !== undefined) params = params.set('is_active', filters.is_active);
    return this.http.get<AdminUser[]>(`${this.API}/admin/users`, { params });
  }

  approveCourse(id: string): Observable<unknown> {
    return this.http.patch(`${this.API}/admin/courses/${id}/approve`, {});
  }

  rejectCourse(id: string): Observable<unknown> {
    return this.http.patch(`${this.API}/admin/courses/${id}/reject`, {});
  }

  getPendingCourses(): Observable<PendingCourse[]> {
    return this.http.get<PendingCourse[]>(`${this.API}/admin/courses/pending`);
  }

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.API}/admin/stats`);
  }
}
