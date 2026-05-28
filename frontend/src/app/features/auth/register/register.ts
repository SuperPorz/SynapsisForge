import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { passwordMatchValidator } from './password-match.validator';

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);

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
      birth_date:      ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
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

  onSubmit(): void {
    if (this.form.invalid) return;
    const { confirmPassword, ...payload } = this.form.value;
    // payload corrisponde esattamente al CreateUserDto
    console.log(payload);
  }

  navigateToGoogle(): void {
    window.location.href = '/api/auth/google';
  }

  navigateToGithub(): void {
    window.location.href = '/api/auth/github';
  }
}
