import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.develop';

export interface ClientTokenResponse {
  clientToken: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payments`;

  getClientToken(): Observable<ClientTokenResponse> {
    return this.http.get<ClientTokenResponse>(`${this.baseUrl}/client-token`);
  }
}
