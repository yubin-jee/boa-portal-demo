You are working on GlobalBank's client portal — an Angular 14 application used by
59 million verified digital users to manage payments, transfers, and profile settings.

This codebase is a stand-in for Bank of America's consumer portal architecture.
Angular 14 reached End of Life in November 2023. Running EOL frontend dependencies
in a regulated financial institution creates exposure under OCC Bulletin 2023-17
(Technology Risk Management) and BofA's AI oversight council standards.

---

## Your migration tasks (Angular 14 → Angular 18)

### 1. Bootstrap & root module
- Update `src/main.ts`: replace `bootstrapModule(AppModule)` with
  `bootstrapApplication(AppComponent, appConfig)`
- Create `src/app/app.config.ts` with `ApplicationConfig` containing:
  - `provideRouter(routes)` (routes extracted from AppRoutingModule)
  - `provideHttpClient(withInterceptors([authInterceptor]))`
  - `provideAnimations()`
- Delete `app.module.ts`, `app-routing.module.ts`, `core/core.module.ts`

### 2. Auth guard — CanActivate interface (removed in Angular 17)
- Rewrite `core/guards/auth.guard.ts` as a functional guard:
  `export const authGuard: CanActivateFn = (route, state) => { ... }`
  Use `inject(SessionService)` and `inject(Router)` inside the function.
- Update all `canActivate: [AuthGuard]` references in routes to `canActivate: [authGuard]`

### 3. Auth interceptor — HttpInterceptor class (changed in Angular 15+)
- Rewrite `core/interceptors/auth.interceptor.ts` as a functional interceptor:
  `export const authInterceptor: HttpInterceptorFn = (req, next) => { ... }`
  Use `inject(SessionService)` inside the function.
- Register via `provideHttpClient(withInterceptors([authInterceptor]))` in app.config.ts
- Delete `CoreModule` — it exists only to register the interceptor

### 4. Feature modules → standalone components + loadComponent
For each of the three feature modules (Payments, Transfers, Profile):
- Convert every component in the module to standalone (`standalone: true` in decorator)
- Add `imports: [CommonModule, ReactiveFormsModule, ...]` to each component directly
- Delete the feature module file (payments.module.ts, transfers.module.ts, profile.module.ts)
- Update app.config.ts routes: replace `loadChildren` with `loadComponent` pointing
  directly to each feature's root component

### 5. ComponentFactoryResolver — REMOVED in Angular 16 (hardest change)
File: `features/payments/payment-submission/payment-submission.component.ts`

`ComponentFactoryResolver.resolveComponentFactory()` no longer exists.
Rewrite `renderConfirmation()` to use `ViewContainerRef.createComponent()` directly:
```typescript
// Angular 18
const ref = this.confirmationHost.createComponent(PaymentConfirmationComponent);
ref.instance.result = result;
```
Remove `ComponentFactoryResolver` from the constructor entirely.
`PaymentConfirmationComponent` must also become standalone.

### 6. Subscription teardown — replace Subject/ngOnDestroy pattern
In every component that uses `private destroy$ = new Subject<void>()`:
- Replace with `private destroyRef = inject(DestroyRef);`
- Replace `.pipe(takeUntil(this.destroy$))` with `.pipe(takeUntilDestroyed(this.destroyRef))`
- Remove the `ngOnDestroy()` lifecycle hook entirely
- Remove `OnDestroy` from the `implements` clause

### 7. LoadingSpinnerComponent — shared-ui
This component is currently re-declared in each feature module's `declarations[]`.
- Make it standalone
- Each component that uses `<gb-loading-spinner>` imports it directly in its own `imports[]`

### 8. Update all spec files
For every `*.spec.ts`:
- Remove `declarations: [...]` arrays — standalone components use `imports: [ComponentClass]`
- Replace `HttpClientTestingModule` with `provideHttpClientTesting()` + `provideHttpClient()`
  in the `providers` array
- Ensure all tests still pass

### 9. Verify compilation
Run `npx tsc --noEmit` from `client-portal/`. Fix all TypeScript errors.

---

## Regulatory note on payment-submission
The `PaymentSubmissionComponent` is marked REGULATORY CRITICAL (OCC Bulletin 2023-17).
As part of this migration, also expand `payment-submission.component.spec.ts` to cover:
- Form validation for all fields (routing number pattern, amount min/max, BSA threshold)
- The error state branch in `renderConfirmation()`
- The `PAYMENT_SUBMISSION_V3` feature flag branch (stub the flag as enabled)
Coverage must reach ≥90% on this component. See ticket GB-4471.

---

## Deliverable
Create a pull request with:
- Title: "feat: migrate client-portal from Angular 14 to Angular 18"
- Description listing every breaking change, the Angular 14 pattern, the Angular 18
  replacement, and which files were deleted
- All tests passing
