import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.develop';

export interface ClientTokenResponse {
  clientToken: string;
}

export interface CheckoutResponse {
  success: boolean;
  transactionId: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payments`;

  getClientToken(): Observable<ClientTokenResponse> {
    return this.http.get<ClientTokenResponse>(`${this.baseUrl}/client-token`);
  }

  processCheckout(courseId: string, nonce: string, amount: number): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.baseUrl}/checkout`, { courseId, nonce, amount });
  }
}
