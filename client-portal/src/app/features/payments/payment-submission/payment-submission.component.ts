import {
  Component,
  ComponentFactoryResolver,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaymentsService, PaymentResult } from '../payments.service';
import { PaymentConfirmationComponent } from './payment-confirmation/payment-confirmation.component';

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  REGULATORY CRITICAL                                                     ║
// ║  OCC Bulletin 2023-17 — Technology Risk Management                      ║
// ║  This component controls domestic and international wire submission.     ║
// ║  Any modification requires sign-off from Technology Risk & Compliance.  ║
// ║  Feature flag: PAYMENT_SUBMISSION_V3                                     ║
// ║  Minimum required test coverage: 90% (currently: 34% — SEE TICKET       ║
// ║  GB-4471: "Increase payment-submission coverage before Q2 audit")        ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ─────────────────────────────────────────────────────────────────────────────
// BREAKING CHANGE #1: ComponentFactoryResolver
//
// Angular 14: dynamically renders PaymentConfirmationComponent (success/error
// states) via ComponentFactoryResolver.resolveComponentFactory().
// API was deprecated in Angular 13 and REMOVED in Angular 16.
//
// This cannot be fixed with find-and-replace. Devin must understand that the
// intent is dynamic component rendering and rewrite using:
//   this.confirmationHost.createComponent(PaymentConfirmationComponent)
//
// BREAKING CHANGE #2: Subject/ngOnDestroy teardown
// Angular 18 target: inject(DestroyRef) + takeUntilDestroyed(destroyRef)
// ─────────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'gb-payment-submission',
  templateUrl: './payment-submission.component.html',
})
export class PaymentSubmissionComponent implements OnInit, OnDestroy {
  @ViewChild('confirmationHost', { read: ViewContainerRef })
  confirmationHost!: ViewContainerRef;

  form!: FormGroup;
  submitting = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private paymentsService: PaymentsService,
    // ⚠️ Removed in Angular 16
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      recipientAccountNumber: ['', [Validators.required, Validators.pattern(/^\d{8,17}$/)]],
      routingNumber:          ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      amount:                 [null, [Validators.required, Validators.min(0.01), Validators.max(1_000_000)]],
      memo:                   ['', Validators.maxLength(140)],
      paymentType:            ['domestic', Validators.required],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    this.confirmationHost?.clear();

    this.paymentsService
      .submitPayment(this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.submitting = false;
          this.renderConfirmation(result);
        },
        error: err => {
          this.submitting = false;
          this.renderConfirmation({ success: false, referenceId: null, error: err.message });
        },
      });
  }

  private renderConfirmation(result: PaymentResult): void {
    if (!this.confirmationHost) return;
    this.confirmationHost.clear();

    // ⚠️ Angular 14: ComponentFactoryResolver required before createComponent()
    const factory = this.componentFactoryResolver
      .resolveComponentFactory(PaymentConfirmationComponent);
    const ref = this.confirmationHost.createComponent(factory);

    ref.instance.result = result;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
