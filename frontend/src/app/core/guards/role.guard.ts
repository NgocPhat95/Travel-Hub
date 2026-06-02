import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.user();
  if (user && user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Redirect to home if not authorized as SUPER_ADMIN
  router.navigate(['/']);
  return false;
};
