import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  template: `
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <p class="text-fg-muted">{{ status }}</p>
    </div>
  `,
})
export class VerifyEmail implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  status = 'Verifying your email…';

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.status = 'Invalid verification link.';
      return;
    }

    this.http
      .get<{ accessToken: string }>(
        `${environment.apiUrl}/auth/verify-email/${token}`,
        { withCredentials: true },
      )
      .subscribe({
        next: (res) => {
          this.authService.applyToken(res.accessToken);
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.status = 'Verification failed. The link may have expired.';
          setTimeout(() => this.router.navigate(['/login']), 3000);
        },
      });
  }
}
