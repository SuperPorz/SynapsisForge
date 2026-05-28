import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirm  = group.get('confirmPassword')?.value;

    return password === confirm ? null : { passwordMismatch: true };
  };
}
// Password123!