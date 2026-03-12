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

## Breaking changes Devin must fix

| # | File | Angular 14 | Angular 18 | Demo moment |
|---|------|-----------|-----------|-------------|
| 1 | `payment-submission.component.ts` | `ComponentFactoryResolver` (removed in v16) | `viewContainerRef.createComponent()` | "Can't be find-replaced — Devin understands intent" |
| 2 | `auth.guard.ts` | `CanActivate` class interface (removed in v17) | `CanActivateFn` functional guard | "Every route runs through this" |
| 3 | `auth.interceptor.ts` | `HttpInterceptor` class | `HttpInterceptorFn` | "Every API call — one wrong change breaks auth" |
| 4 | `*.module.ts` (×3) | NgModule + `loadChildren` | Standalone + `loadComponent` | "Three modules, all their components" |
| 5 | All `*.spec.ts` | `declarations[]`, `HttpClientTestingModule` | `imports[]`, `provideHttpClient()` | "Tests updated alongside — no broken specs left behind" |
| 6 | All components | `Subject/destroy$/ngOnDestroy` | `inject(DestroyRef)` + `takeUntilDestroyed()` | "Modern lifecycle management" |

## BofA talking points wired into the code

- **$13B tech budget, 18K devs on Copilot** → 20% gains. Devin is the next order of magnitude.
- **Hari Gopalkrishnan (CTO):** coding AI is for *"safely reproducible"* activities — migration is that exactly.
- **`payment-submission.component.spec.ts`:** coverage at 34%, Q2 OCC audit requires 90% — Devin fixes this.
- **Zelle:** $556B, 1.8B transactions in 2025 — the transfers code is not toy code.
- **KBA:** FFIEC Authentication Guidance compliance — regulated UX that must migrate cleanly.

## Demo flow (10–12 min live)

1. Show `app.module.ts` — "everything declared here, Angular 14 paradigm"
2. Show `payment-submission.component.ts` — point out REGULATORY CRITICAL block + `ComponentFactoryResolver`
3. Show `payment-submission.component.spec.ts` — "34% coverage, Q2 audit coming"
4. Show `auth.guard.ts` — "deprecated CanActivate, protects every route"
5. Paste `DEVIN_PROMPT.md` into Devin, start the task
6. Narrate Devin's plan, then its execution
7. Show the PR — before/after diffs, updated tests, files deleted
8. Scale: "This repo has 3 modules. BofA's consumer portal has hundreds."
