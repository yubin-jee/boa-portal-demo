import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionService } from '../services/session.service';

// ─────────────────────────────────────────────────────────────────────────────
// BREAKING CHANGE: HttpInterceptor class interface
//
// Angular 14: class implementing HttpInterceptor, registered via
//   { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
//   in CoreModule providers.
//
// Angular 18 migration target:
//   export const authInterceptor: HttpInterceptorFn = (req, next) => { ... }
//   Registered via withInterceptors([authInterceptor]) inside provideHttpClient().
//   No class, no @Injectable, no CoreModule registration.
//
// This interceptor attaches the GlobalBank session token to every outbound
// API request. A failed migration breaks auth on all 270+ ML model API calls,
// Zelle payment endpoints, and the core banking data layer.
// ─────────────────────────────────────────────────────────────────────────────
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private sessionService: SessionService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.sessionService.getAccessToken();

    if (!token) {
      return next.handle(req);
    }

    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-GB-Client': 'web-portal-v14',
        'X-Request-ID': crypto.randomUUID(),
      },
    });

    return next.handle(authReq);
  }
}
