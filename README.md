# GlobalBank Client Portal — Angular 14 Demo Repo

Demo codebase for Devin executive pitch. Simulates Bank of America's consumer
banking portal on Angular 14 awaiting migration to Angular 18.

## Repo structure

```
boa-portal-demo/
├── client-portal/          Angular 14 app (the migration target)
│   └── src/app/
│       ├── core/           Auth guard (deprecated CanActivate) + interceptor (HttpInterceptor)
│       ├── shared-ui/      GlobalBank branded LoadingSpinnerComponent
│       └── features/
│           ├── payments/   PaymentSubmissionComponent ← REGULATORY CRITICAL, ComponentFactoryResolver
│           ├── transfers/  ZelleTransferComponent     ← $556B in transactions in 2025
│           └── profile/    KbaVerificationComponent   ← FFIEC auth compliance
├── api/                    .NET/C# endpoint stubs (ASP.NET Core reference)
└── DEVIN_PROMPT.md         Paste this into Devin verbatim
```






















| # | File | Angular 14 | Angular 18 | Demo moment |
|---|------|-----------|-----------|-------------|
| 1 | `payment-submission.component.ts` | `ComponentFactoryResolver` (removed in v16) | `viewContainerRef.createComponent()` | "Can't be find-replaced — Devin understands intent" |
| 2 | `auth.guard.ts` | `CanActivate` class interface (removed in v17) | `CanActivateFn` functional guard | "Every route runs through this" |
| 3 | `auth.interceptor.ts` | `HttpInterceptor` class | `HttpInterceptorFn` | "Every API call — one wrong change breaks auth" |
| 4 | `*.module.ts` (×3) | NgModule + `loadChildren` | Standalone + `loadComponent` | "Three modules, all their components" |
| 5 | All `*.spec.ts` | `declarations[]`, `HttpClientTestingModule` | `imports[]`, `provideHttpClient()` | "Tests updated alongside — no broken specs left behind" |
| 6 | All components | `Subject/destroy$/ngOnDestroy` | `inject(DestroyRef)` + `takeUntilDestroyed()` | "Modern lifecycle management" |
