import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaymentsService, PaymentLimit } from '../payments.service';
import { LoadingSpinnerComponent } from '../../../shared-ui/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'gb-payments-limits',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './payments-limits.component.html',
})
export class PaymentsLimitsComponent implements OnInit {
  limits: PaymentLimit[] = [];
  loading = true;
  error: string | null = null;

  private destroyRef = inject(DestroyRef);

  constructor(private paymentsService: PaymentsService) {}

  ngOnInit(): void {
    this.paymentsService.getLimits()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: limits => { this.limits = limits; this.loading = false; },
        error: () => { this.error = 'Unable to load payment limits.'; this.loading = false; },
      });
  }
}
