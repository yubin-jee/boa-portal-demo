import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface KbaQuestion {
  questionId: string;
  questionText: string;
}

// KBA = Knowledge-Based Authentication.
// Used by GlobalBank for high-risk profile changes: adding a new payee,
// updating a phone number, re-enabling a locked account.
// Regulated under FFIEC Authentication Guidance (2011, updated 2022).
// Failure to correctly migrate this component breaks the account recovery flow
// for GlobalBank's 59 million verified digital users.
@Component({
  selector: 'gb-kba-verification',
  templateUrl: './kba-verification.component.html',
})
export class KbaVerificationComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  questions: KbaQuestion[] = [];
  loading = true;
  verifying = false;
  verified = false;
  failed = false;
  attemptsRemaining = 3;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<KbaQuestion[]>('/api/v2/profile/kba/questions')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: questions => {
          this.questions = questions;
          this.loading = false;
          this.form = this.fb.group(
            Object.fromEntries(questions.map(q => [q.questionId, ['', Validators.required]]))
          );
        },
        error: () => (this.loading = false),
      });
  }

  verify(): void {
    if (this.form.invalid || this.verifying) return;
    this.verifying = true;

    this.http
      .post<{ verified: boolean; attemptsRemaining: number }>(
        '/api/v2/profile/kba/verify',
        this.form.value
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.verifying = false;
          this.attemptsRemaining = res.attemptsRemaining;
          if (res.verified) {
            this.verified = true;
          } else {
            this.failed = true;
            this.form.reset();
          }
        },
        error: () => (this.verifying = false),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
