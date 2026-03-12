import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

// Angular 14: lazy-loaded feature modules via loadChildren.
// Angular 18 migration targets:
//   • RouterModule.forRoot()  → provideRouter(routes) in app.config.ts
//   • loadChildren (NgModule) → loadComponent (standalone) for each feature
//   • AuthGuard class         → authGuard function (CanActivateFn)
const routes: Routes = [
  { path: '', redirectTo: 'payments', pathMatch: 'full' },
  {
    path: 'payments',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/payments/payments.module').then(m => m.PaymentsModule),
  },
  {
    path: 'transfers',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/transfers/transfers.module').then(m => m.TransfersModule),
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/profile/profile.module').then(m => m.ProfileModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
