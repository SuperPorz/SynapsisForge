import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <p class="text-fg-muted">{{ status }}</p>
    </div>
  `,
})
export class OAuthCallback implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);

  status = 'Completing login…';

  ngOnInit(): void {
    const accessToken = this.route.snapshot.queryParamMap.get('accessToken');
    if (accessToken) {
      this.authService.applyToken(accessToken);
      this.router.navigate(['/dashboard']);
    } else {
      this.status = 'Authentication failed. Redirecting…';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }
}
