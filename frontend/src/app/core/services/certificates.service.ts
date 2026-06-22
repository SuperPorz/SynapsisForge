import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.develop';

export interface UserCertificate {
  id: string;
  issued_at: string;
  pdf_url: string;
  is_valid: boolean;
  certificate_code: string;
  courseTitle: string;
  courseId: string;
}

@Injectable({ providedIn: 'root' })
export class CertificatesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/certificates`;

  getMyCertificates(): Observable<UserCertificate[]> {
    return this.http.get<UserCertificate[]>(`${this.baseUrl}/my`);
  }
}
