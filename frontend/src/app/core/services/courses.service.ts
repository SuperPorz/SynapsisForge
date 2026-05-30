import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Course } from '../models/course-model';
import { environment } from '../../../environments/environment.develop';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  constructor() {
    console.log(this.API);
  }

  getFeaturedCourses(): Observable<{
    data: { data: Course[]; total: number };
    statusCode: number;
    timestamp: string;
  }> {
    return this.http.get<{
      data: { data: Course[]; total: number };
      statusCode: number;
      timestamp: string;
    }>(`${this.API}/courses?featured=true&limit=3&page=1`);
  }
}
