import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaymentsService, PaymentLimit } from '../payments.service';

@Component({
  selector: 'gb-payments-limits',
  templateUrl: './payments-limits.component.html',
})
export class PaymentsLimitsComponent implements OnInit, OnDestroy {
  limits: PaymentLimit[] = [];
  loading = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private paymentsService: PaymentsService) {}

  ngOnInit(): void {
    this.paymentsService.getLimits()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: limits => { this.limits = limits; this.loading = false; },
        error: () => { this.error = 'Unable to load payment limits.'; this.loading = false; },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
