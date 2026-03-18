import { Component, Input } from '@angular/core';

@Component({
  selector: 'gb-loading-spinner',
  standalone: true,
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
