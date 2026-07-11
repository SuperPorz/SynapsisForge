import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { passwordMatchValidator } from './password-match.validator';
import { AuthService, RegisterDto } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { TestCredentials } from '../components/test-credentials/test-credentials';

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule, TestCredentials],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Valori dell'enum Country — DA SISTEMARE IN FUTURO
  countries = [
    'ITALY', 'FRANCE', 'GERMANY', 'SPAIN', 'PORTUGAL',
    'UNITED_KINGDOM', 'UNITED_STATES', 'OTHER'
  ];

  form = this.fb.group(
    {
      first_name:      ['', [Validators.required, Validators.minLength(2)]],
      last_name:       ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      birth_date:      ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
      country:         ['', Validators.required],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator() }
  );

  //usiamo un getter per abbreviare l'accesso ai controlli del form nel template
  //è puro shortend per evitare di scrivere form.controls ogni volta (verbosità)
  get f() { return this.form.controls; }

  get passwordMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && !!this.f.confirmPassword.touched; //!! converte in booleano
  }

  errorMessage = '';

  onSubmit(): void {
    if (this.form.invalid) return;
    this.errorMessage = '';
    const { confirmPassword, birth_date, ...rest } = this.form.value;
    const [dd, mm, yyyy] = (birth_date as string).split('/');
    const payload = { ...rest, birth_date: `${yyyy}-${mm}-${dd}` };
    this.authService.register(payload as RegisterDto).subscribe({
      next: () => this.router.navigate(['/login'], {
        queryParams: { registered: 'true' },
      }),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed. Try again.';
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
