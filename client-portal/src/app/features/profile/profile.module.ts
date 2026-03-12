import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { KbaVerificationComponent } from './kba-verification/kba-verification.component';
import { LoadingSpinnerComponent } from '../../shared-ui/components/loading-spinner/loading-spinner.component';

@NgModule({
  declarations: [KbaVerificationComponent, LoadingSpinnerComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: KbaVerificationComponent }]),
  ],
})
export class ProfileModule {}
