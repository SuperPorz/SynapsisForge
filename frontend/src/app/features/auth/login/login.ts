import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { TestCredentials } from '../components/test-credentials/test-credentials';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TestCredentials],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  registered = false;
  verified = false;
  errorMessage = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    const params = this.activatedRoute.snapshot.queryParamMap;
    this.registered = params.get('registered') === 'true';
    this.verified = params.get('verified') === 'true';

    const email = params.get('email');
    const password = params.get('password');
    if (email) this.form.patchValue({ email });
    if (password) this.form.patchValue({ password });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.errorMessage.set('');
    const { email, password } = this.form.value;
    this.authService
      .login({
        email: email as string,
        password: password as string,
      })
      .subscribe({
        next: () => this.router.navigate(['/courses']),
        error: (err) => {
          this.errorMessage.set(err.error?.message || err.message || 'Login failed. Please try again.');
        },
      });
  }

  navigateToGoogle(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  navigateToGithub(): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }
}
