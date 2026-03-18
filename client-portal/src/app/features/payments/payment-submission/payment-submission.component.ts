import {
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaymentsService, PaymentResult } from '../payments.service';
import { PaymentConfirmationComponent } from './payment-confirmation/payment-confirmation.component';

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  REGULATORY CRITICAL                                                     ║
// ║  OCC Bulletin 2023-17 — Technology Risk Management                      ║
// ║  This component controls domestic and international wire submission.     ║
// ║  Any modification requires sign-off from Technology Risk & Compliance.  ║
// ║  Feature flag: PAYMENT_SUBMISSION_V3                                     ║
// ╚══════════════════════════════════════════════════════════════════════════╝
@Component({
  selector: 'gb-payment-submission',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaymentConfirmationComponent],
  templateUrl: './payment-submission.component.html',
})
export class PaymentSubmissionComponent implements OnInit {
  @ViewChild('confirmationHost', { read: ViewContainerRef })
  confirmationHost!: ViewContainerRef;

  form!: FormGroup;
  submitting = false;

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private paymentsService = inject(PaymentsService);

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
      .pipe(takeUntilDestroyed(this.destroyRef))
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

  renderConfirmation(result: PaymentResult): void {
    if (!this.confirmationHost) return;
    this.confirmationHost.clear();

    const ref = this.confirmationHost.createComponent(PaymentConfirmationComponent);
    ref.instance.result = result;
  }
}
