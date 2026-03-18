import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
