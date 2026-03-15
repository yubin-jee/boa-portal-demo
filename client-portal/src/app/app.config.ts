import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authGuard } from './core/guards/auth.guard';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const routes: Routes = [
  { path: '', redirectTo: 'payments', pathMatch: 'full' },
  {
    path: 'payments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/payments/payment-submission/payment-submission.component').then(
        m => m.PaymentSubmissionComponent
      ),
  },
  {
    path: 'payments/limits',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/payments/payments-limits/payments-limits.component').then(
        m => m.PaymentsLimitsComponent
      ),
  },
  {
    path: 'transfers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/transfers/zelle-transfer/zelle-transfer.component').then(
        m => m.ZelleTransferComponent
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/kba-verification/kba-verification.component').then(
        m => m.KbaVerificationComponent
      ),
  },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
  ],
};
