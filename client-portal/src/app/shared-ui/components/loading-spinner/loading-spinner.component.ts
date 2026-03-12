import { Component, Input } from '@angular/core';

// GlobalBank shared UI — used across Payments, Transfers, and Profile features.
// Angular 14: declared in each feature module's declarations[].
// Angular 18 migration target: standalone component, imported directly where used.
@Component({
  selector: 'gb-loading-spinner',
  template: `
    <div class="gb-spinner" [attr.aria-label]="label" role="status">
      <div class="gb-spinner__ring"></div>
      <span class="gb-spinner__label">{{ label }}</span>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  @Input() label = 'Loading…';
}
