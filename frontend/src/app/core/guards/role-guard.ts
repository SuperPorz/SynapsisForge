import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  //step 1: verifico se l'utente è autenticato, se non lo è, reindirizzo alla pagina di login
  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']); // reindirizza alla pagina di login se non autenticato
  }
  
  //step 2: leggo i ruoli richiesti dalla route e quelli dell'utente
  const requiredRoles = route.data['roles'];
  const userRole = authService.getRole();

  //step 3: verifico se l'utente ha almeno uno dei ruoli richiesti, se non li ha, reindirizzo alla pagina di accesso negato
  if (requiredRoles && !userRole) {
    return router.createUrlTree(['/dashboard']); // TODO: redirect temporaneo alla dashboard, da sostituire con una pagina di accesso negato
  }

  return true;
};
