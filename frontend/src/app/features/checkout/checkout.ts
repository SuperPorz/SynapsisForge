import { Component, ElementRef, inject, OnDestroy, OnInit, viewChild, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CourseService } from '../../core/services/courses.service';
import { CartService, CartItem } from '../../core/services/cart.service';
import { PaymentsService } from '../../core/services/payments.service';
import { Course } from '../../core/models/course-model';
import * as dropin from 'braintree-web-drop-in';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private cartService = inject(CartService);
  private paymentsService = inject(PaymentsService);

  dropinContainer = viewChild<ElementRef<HTMLDivElement>>('dropinContainer');

  isCartCheckout = false;
  course = signal<Course | null>(null);
  cartItems = signal<CartItem[]>([]);
  cartTotal = signal(0);
  loading = signal(true);
  paying = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  private dropinInstance: dropin.Dropin | null = null;

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('courseId');
    if (courseId) {
      this.isCartCheckout = false;
      this.courseService.getCourseById(courseId).subscribe({
        next: (course) => {
          this.course.set(course);
          this.initDropin();
        },
        error: () => {
          this.error.set('Course not found.');
          this.loading.set(false);
        },
      });
    } else {
      this.isCartCheckout = true;
      this.cartService.loadCart();
      if (this.cartService.items().length === 0) {
        this.error.set('Your cart is empty.');
        this.loading.set(false);
        return;
      }
      this.cartItems.set(this.cartService.items());
      this.cartTotal.set(this.cartService.total());
      this.initDropin();
    }
  }

  private initDropin() {
    this.paymentsService.getClientToken().subscribe({
      next: (res) => {
        const container = this.dropinContainer()?.nativeElement;
        if (!container) return;
        dropin.create({
          authorization: res.clientToken,
          container,
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

  pay() {
    if (!this.dropinInstance || this.paying()) return;
    this.paying.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.dropinInstance.requestPaymentMethod().then((payload) => {
      const amount = this.isCartCheckout ? this.cartTotal() : this.course()!.price;

      if (this.isCartCheckout) {
        this.cartService.checkout(payload.nonce, amount).subscribe({
          next: (res) => {
            this.successMessage.set(`Payment successful! You've been enrolled in ${res.itemCount} course(s).`);
            this.paying.set(false);
            this.dropinInstance?.teardown().catch(() => {});
          },
          error: (err) => {
            this.error.set(err.error?.message ?? err.message ?? 'Payment failed.');
            this.paying.set(false);
          },
        });
      } else {
        const courseId = this.course()!.id;
        this.paymentsService.processCheckout(courseId, payload.nonce, amount).subscribe({
          next: (res) => {
            this.successMessage.set('Payment successful! Redirecting to your courses...');
            this.paying.set(false);
            this.dropinInstance?.teardown().catch(() => {});
            setTimeout(() => this.router.navigate(['/dashboard/my-enrolls']), 2000);
          },
          error: (err) => {
            this.error.set(err.error?.message ?? err.message ?? 'Payment failed.');
            this.paying.set(false);
          },
        });
      }
    }).catch(() => {
      this.error.set('Payment failed. Please try again.');
      this.paying.set(false);
    });
  }

  ngOnDestroy() {
    this.dropinInstance?.teardown().catch(() => {});
  }
}
