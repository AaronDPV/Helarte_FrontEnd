import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ApiService } from './services/api.service';

export const roleRouteGuard: CanActivateFn = route => {
  const api = inject(ApiService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as string[];
  const checkRole = () => allowedRoles.includes(api.currentUser?.rol ?? '')
    ? true
    : router.parseUrl('/inicio');

  if (api.currentUser) return checkRole();
  if (!api.hasSavedCredentials()) return router.parseUrl('/inicio');

  return api.restoreSession().pipe(
    map(user => {
      api.saveLoggedUser(user);
      return checkRole();
    }),
    catchError(() => {
      api.clearCredentials();
      return of(router.parseUrl('/inicio'));
    })
  );
};
