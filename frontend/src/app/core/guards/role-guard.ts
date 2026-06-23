import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const requiredRoles = route.data['roles'] as string[] | undefined;
  const userRole = authService.role();

  if (requiredRoles && (!userRole || !requiredRoles.includes(userRole))) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
