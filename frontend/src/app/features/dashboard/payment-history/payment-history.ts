import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { PaymentsService, PaymentHistoryItem } from '../../../core/services/payments.service';

@Component({
  selector: 'app-payment-history',
  imports: [DatePipe, CurrencyPipe, TitleCasePipe],
  templateUrl: './payment-history.html',
})
export class PaymentHistory implements OnInit {
  private paymentsService = inject(PaymentsService);
  protected Math = Math;

  payments = signal<PaymentHistoryItem[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(20);
  loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.paymentsService.getHistory(this.page(), this.limit()).subscribe({
      next: (res) => {
        this.payments.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.page() * this.limit() < this.total()) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }
}
