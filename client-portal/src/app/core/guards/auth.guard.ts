import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SessionService } from '../services/session.service';

// ─────────────────────────────────────────────────────────────────────────────
// BREAKING CHANGE: CanActivate interface
//
// Angular 14: class-based guard implementing CanActivate.
// Deprecated in Angular 15.1, removed in Angular 17.
//
// Angular 18 migration target:
//   export const authGuard: CanActivateFn = (route, state) => { ... }
//   No class, no @Injectable, no DI constructor — inject() used inline.
//
// Every protected route in app-routing.module.ts references this guard.
// A wrong migration silently breaks authentication for all three feature areas:
// Payments, Transfers, and Profile.
// ─────────────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private sessionService: SessionService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.sessionService.isAuthenticated$.pipe(
      map(authenticated => {
        if (authenticated) return true;
        return this.router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url },
        });
      })
    );
  }
}
