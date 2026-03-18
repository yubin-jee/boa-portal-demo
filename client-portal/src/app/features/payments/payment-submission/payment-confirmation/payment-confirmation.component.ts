import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { PaymentResult } from '../../payments.service';

@Component({
  selector: 'gb-payment-confirmation',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="gb-confirmation" [class.success]="result.success" [class.error]="!result.success">
      <ng-container *ngIf="result.success">
        <h2>Payment Submitted</h2>
        <p>Reference ID: <strong>{{ result.referenceId }}</strong></p>
        <p>Your payment is being processed. You will receive a confirmation alert.</p>
      </ng-container>
      <ng-container *ngIf="!result.success">
        <h2>Submission Failed</h2>
        <p>{{ result.error }}</p>
        <p>Please contact GlobalBank support if this issue persists.</p>
      </ng-container>
    </div>
  `,
})
export class PaymentConfirmationComponent {
  @Input() result!: PaymentResult;
}
