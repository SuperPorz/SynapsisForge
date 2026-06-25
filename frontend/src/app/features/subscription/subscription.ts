import { Component, ElementRef, inject, OnDestroy, OnInit, viewChild, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PaymentsService } from '../../core/services/payments.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import * as dropin from 'braintree-web-drop-in';

@Component({
  selector: 'app-subscription',
  imports: [RouterLink],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css',
})
export class Subscription implements OnInit, OnDestroy {
  private paymentsService = inject(PaymentsService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  dropinContainer = viewChild<ElementRef<HTMLDivElement>>('dropinContainer');

  loading = signal(true);
  subscribing = signal(false);
  error = signal<string | null>(null);

  private dropinInstance: dropin.Dropin | null = null;

  ngOnInit() {
    this.initDropin();
  }

  initDropin() {
    this.paymentsService.getClientToken().subscribe({
      next: (res) => {
        const container = this.dropinContainer()?.nativeElement;
        if (!container) return;
        dropin.create({
          authorization: res.clientToken,
          container,
          paypal: {
            flow: 'checkout',
            amount: '9.99',
            currency: 'EUR',
          },
        }).then((instance) => {
          this.dropinInstance = instance;
          this.loading.set(false);
        }).catch(() => {
          this.error.set('Failed to load payment form.');
          this.loading.set(false);
        });
      },
      error: () => {
        this.error.set('Failed to initialize payment.');
        this.loading.set(false);
      },
    });
  }

  subscribe() {
    if (!this.dropinInstance || this.subscribing()) return;
    this.subscribing.set(true);
    this.error.set(null);

    this.dropinInstance.requestPaymentMethod().then((payload) => {
      this.paymentsService.subscribe(payload.nonce, 'premium_monthly').subscribe({
        next: (res) => {
          this.subscribing.set(false);
          this.dropinInstance?.teardown().catch(() => {});
          this.auth.setPlan('PREMIUM');
          this.toast.show('Premium subscription activated!');
          this.router.navigate(['/dashboard/my-enrolls']);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message ?? 'Subscription failed.');
          this.subscribing.set(false);
        },
      });
    }).catch(() => {
      this.error.set('Payment method request failed. Please try again.');
      this.subscribing.set(false);
    });
  }

  ngOnDestroy() {
    this.dropinInstance?.teardown().catch(() => {});
  }
}
