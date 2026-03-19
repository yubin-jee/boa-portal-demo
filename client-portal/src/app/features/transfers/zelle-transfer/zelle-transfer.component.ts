import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface ZelleContact {
  id: string;
  displayName: string;
  handle: string; // email or phone
  verified: boolean;
}

@Component({
  selector: 'gb-zelle-transfer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './zelle-transfer.component.html',
})
export class ZelleTransferComponent implements OnInit {
  form!: FormGroup;
  contacts: ZelleContact[] = [];
  sending = false;
  sent = false;
  error: string | null = null;

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  ngOnInit(): void {
    this.form = this.fb.group({
      recipientHandle: ['', [Validators.required, Validators.email]],
      amount: [null, [Validators.required, Validators.min(1), Validators.max(2500)]],
      note: ['', Validators.maxLength(100)],
    });

    this.http
      .get<ZelleContact[]>('/api/v2/zelle/contacts')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: c => (this.contacts = c), error: () => {} });
  }

  send(): void {
    if (this.form.invalid) return;
    this.sending = true;

    this.http
      .post('/api/v2/zelle/send', this.form.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.sending = false; this.sent = true; },
        error: err => { this.sending = false; this.error = err.message; },
      });
  }
}
