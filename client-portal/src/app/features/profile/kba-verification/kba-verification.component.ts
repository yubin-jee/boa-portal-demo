import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingSpinnerComponent } from '../../../shared-ui/components/loading-spinner/loading-spinner.component';

export interface KbaQuestion {
  questionId: string;
  questionText: string;
}

@Component({
  selector: 'gb-kba-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './kba-verification.component.html',
})
export class KbaVerificationComponent implements OnInit {
  form!: FormGroup;
  questions: KbaQuestion[] = [];
  loading = true;
  verifying = false;
  verified = false;
  failed = false;
  attemptsRemaining = 3;

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  ngOnInit(): void {
    this.http
      .get<KbaQuestion[]>('/api/v2/profile/kba/questions')
      .pipe(takeUntilDestroyed(this.destroyRef))
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
}
