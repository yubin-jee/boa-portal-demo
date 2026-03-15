import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { SessionService } from '../services/session.service';

// Angular 18: functional guard using CanActivateFn and inject().
// Replaces the class-based CanActivate guard removed in Angular 17.
export const authGuard: CanActivateFn = (route, state) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  return sessionService.isAuthenticated$.pipe(
    map(authenticated => {
      if (authenticated) return true;
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    })
  );
};
