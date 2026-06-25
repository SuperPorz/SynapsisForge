import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaymentsService } from '../../../core/services/payments.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-subscription-status',
  imports: [RouterLink],
  templateUrl: './subscription-status.html',
  styleUrl: './subscription-status.css',
})
export class SubscriptionStatus implements OnInit {
  private paymentsService = inject(PaymentsService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  loading = signal(true);
  cancelling = signal(false);
  plan = signal<string | null>(null);
  subscriptionId = signal<string | null>(null);
  isPremium = signal(false);

  ngOnInit() {
    this.paymentsService.getSubscriptionStatus().subscribe({
      next: (res) => {
        this.plan.set(res.plan);
        this.subscriptionId.set(res.subscriptionId);
        this.isPremium.set(res.isPremium);
        this.auth.setPlan(res.plan as 'FREE' | 'PREMIUM');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  cancel() {
    if (!confirm('Are you sure you want to cancel your premium subscription?')) return;
    this.cancelling.set(true);
    this.paymentsService.cancelSubscription().subscribe({
      next: (res) => {
        this.cancelling.set(false);
        this.plan.set('FREE');
        this.subscriptionId.set(null);
        this.isPremium.set(false);
        this.auth.setPlan('FREE');
        this.toast.show(res.message);
      },
      error: (err) => {
        this.cancelling.set(false);
        this.toast.show(err.error?.message ?? 'Failed to cancel subscription.');
      },
    });
  }
}
