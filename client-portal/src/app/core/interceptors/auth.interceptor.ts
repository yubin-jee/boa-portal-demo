import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { SessionService } from '../services/session.service';

// Angular 18: functional interceptor replacing class-based HttpInterceptor.
// Registered via withInterceptors([authInterceptor]) in provideHttpClient().
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const token = sessionService.getAccessToken();

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'X-GB-Client': 'web-portal-v18',
      'X-Request-ID': crypto.randomUUID(),
    },
  });

  return next(authReq);
};
