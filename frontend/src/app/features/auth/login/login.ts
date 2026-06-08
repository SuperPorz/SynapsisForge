import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.value;
    this.authService
      .login({
        email: email as string,
        password: password as string,
      })
      .subscribe({
        next: () => this.router.navigate(['/courses']),
        error: (err) => console.error(err),
      });
  }

  navigateToGoogle(): void {
    window.location.href = '/api/auth/google';
  }

  navigateToGithub(): void {
    window.location.href = '/api/auth/github';
  }
}
