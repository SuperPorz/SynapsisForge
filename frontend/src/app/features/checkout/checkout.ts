import { Component, ElementRef, inject, OnDestroy, OnInit, viewChild, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/courses.service';
import { PaymentsService } from '../../core/services/payments.service';
import { Course } from '../../core/models/course-model';
import * as dropin from 'braintree-web-drop-in';
import { CurrencyPipe } from '@angular/common';

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
  private paymentsService = inject(PaymentsService);

  dropinContainer = viewChild<ElementRef<HTMLDivElement>>('dropinContainer');

  course = signal<Course | null>(null);
  loading = signal(true);
  paying = signal(false);
  error = signal<string | null>(null);

  private dropinInstance: dropin.Dropin | null = null;

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('courseId');
    if (!courseId) {
      this.error.set('Invalid course.');
      this.loading.set(false);
      return;
    }
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
        }).catch((err) => {
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
    this.dropinInstance.requestPaymentMethod().then((payload) => {
      console.log('[Checkout] Nonce received:', payload.nonce);
      alert(`Payment method nonce: ${payload.nonce}\nSend this to server for processing.`);
      this.paying.set(false);
    }).catch((err) => {
      this.error.set('Payment failed. Please try again.');
      this.paying.set(false);
    });
  }

  ngOnDestroy() {
    this.dropinInstance?.teardown().catch(() => {});
  }
}
