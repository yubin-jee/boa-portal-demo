import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ZelleTransferComponent } from './zelle-transfer/zelle-transfer.component';
import { LoadingSpinnerComponent } from '../../shared-ui/components/loading-spinner/loading-spinner.component';

@NgModule({
  declarations: [ZelleTransferComponent, LoadingSpinnerComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: ZelleTransferComponent }]),
  ],
})
export class TransfersModule {}
