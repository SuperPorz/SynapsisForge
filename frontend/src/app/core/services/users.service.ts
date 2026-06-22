import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.develop';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  createdAt: string;
  avatar_url: string | null;
  bio: string | null;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  country?: string;
  avatar_url?: string;
  bio?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/users`;

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/me`);
  }

  updateProfile(payload: UpdateUserPayload): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.baseUrl}/me`, payload);
  }
}
