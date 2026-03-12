import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaymentSubmissionComponent } from './payment-submission/payment-submission.component';
import { PaymentsLimitsComponent } from './payments-limits/payments-limits.component';
import { LoadingSpinnerComponent } from '../../shared-ui/components/loading-spinner/loading-spinner.component';

@NgModule({
  declarations: [
    PaymentSubmissionComponent,
    PaymentsLimitsComponent,
    LoadingSpinnerComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      { path: '', component: PaymentSubmissionComponent },
      { path: 'limits', component: PaymentsLimitsComponent },
    ]),
  ],
})
export class PaymentsModule {}
