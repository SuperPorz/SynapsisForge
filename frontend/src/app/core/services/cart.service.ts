import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface CartItem {
  id: string;
  courseId: string;
  title: string;
  thumbnail_url: string;
  price: number;
  added_at: string;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/cart`;

  items = signal<CartItem[]>([]);
  total = signal(0);
  count = signal(0);
  loading = signal(false);

  courseIds = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.items.set([]);
      this.total.set(0);
      this.count.set(0);
      this.courseIds.set(new Set());
      if (user) {
        this.loadCart();
      }
    });
  }

  loadCart() {
    if (!this.auth.isLoggedIn()) return;
    this.loading.set(true);
    this.http.get<CartResponse>(this.baseUrl).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.count.set(res.count);
        this.courseIds.set(new Set(res.items.map((i) => i.courseId)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addItem(courseId: string) {
    return this.http.post<CartResponse>(this.baseUrl, { courseId }).pipe(
      tap((res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.count.set(res.count);
        this.courseIds.set(new Set(res.items.map((i) => i.courseId)));
      }),
    );
  }

  removeItem(courseId: string) {
    return this.http.delete<CartResponse>(`${this.baseUrl}/${courseId}`).pipe(
      tap((res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.count.set(res.count);
        this.courseIds.set(new Set(res.items.map((i) => i.courseId)));
      }),
    );
  }

  clearCart() {
    return this.http.delete<{ success: boolean }>(this.baseUrl).pipe(
      tap(() => {
        this.items.set([]);
        this.total.set(0);
        this.count.set(0);
        this.courseIds.set(new Set());
      }),
    );
  }

  checkout(nonce: string, total: number) {
    return this.http.post<{ success: boolean; transactionId: string; itemCount: number }>(
      `${this.baseUrl}/checkout`,
      { nonce, total },
    ).pipe(
      tap(() => {
        this.items.set([]);
        this.total.set(0);
        this.count.set(0);
        this.courseIds.set(new Set());
      }),
    );
  }

  isInCart(courseId: string): boolean {
    return this.courseIds().has(courseId);
  }
}
