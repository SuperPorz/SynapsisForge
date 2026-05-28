import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);

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
    // chiamata AuthService — lo colleghiamo dopo
    console.log({ email, password });
  }

  navigateToGoogle(): void {
    window.location.href = '/api/auth/google';
  }

  navigateToGithub(): void {
    window.location.href = '/api/auth/github';
  }
}
