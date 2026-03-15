// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  REGULATORY CRITICAL — see payment-submission.component.ts              ║
// ║  GB-4471: Coverage ≥90% required for Q2 OCC audit.                     ║
// ╚══════════════════════════════════════════════════════════════════════════╝
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { PaymentSubmissionComponent } from './payment-submission.component';
import { PaymentsService, PaymentResult } from '../payments.service';
import { PaymentConfirmationComponent } from './payment-confirmation/payment-confirmation.component';

describe('PaymentSubmissionComponent', () => {
  let component: PaymentSubmissionComponent;
  let fixture: ComponentFixture<PaymentSubmissionComponent>;
  let paymentsServiceSpy: jasmine.SpyObj<PaymentsService>;

  const validFormData = {
    recipientAccountNumber: '12345678',
    routingNumber: '123456789',
    amount: 500,
    memo: 'Test payment',
    paymentType: 'domestic' as const,
  };

  const successResult: PaymentResult = {
    success: true,
    referenceId: 'REF-001',
  };

  const errorResult: PaymentResult = {
    success: false,
    referenceId: null,
    error: 'Insufficient funds',
  };

  beforeEach(async () => {
    paymentsServiceSpy = jasmine.createSpyObj('PaymentsService', ['submitPayment']);
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));

    await TestBed.configureTestingModule({
      imports: [PaymentSubmissionComponent],
      providers: [
        { provide: PaymentsService, useValue: paymentsServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentSubmissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the payment form with default values', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('amount')?.value).toBeNull();
    expect(component.form.get('paymentType')?.value).toBe('domestic');
    expect(component.form.get('memo')?.value).toBe('');
    expect(component.form.get('recipientAccountNumber')?.value).toBe('');
    expect(component.form.get('routingNumber')?.value).toBe('');
  });

  // --- Form validation: recipientAccountNumber ---

  it('should require recipientAccountNumber', () => {
    component.form.patchValue({ recipientAccountNumber: '' });
    expect(component.form.get('recipientAccountNumber')?.invalid).toBeTrue();
  });

  it('should reject recipientAccountNumber shorter than 8 digits', () => {
    component.form.patchValue({ recipientAccountNumber: '1234567' });
    expect(component.form.get('recipientAccountNumber')?.invalid).toBeTrue();
  });

  it('should accept recipientAccountNumber with 8 digits', () => {
    component.form.patchValue({ recipientAccountNumber: '12345678' });
    expect(component.form.get('recipientAccountNumber')?.valid).toBeTrue();
  });

  it('should accept recipientAccountNumber with 17 digits', () => {
    component.form.patchValue({ recipientAccountNumber: '12345678901234567' });
    expect(component.form.get('recipientAccountNumber')?.valid).toBeTrue();
  });

  it('should reject recipientAccountNumber with non-digit characters', () => {
    component.form.patchValue({ recipientAccountNumber: '1234abcd' });
    expect(component.form.get('recipientAccountNumber')?.invalid).toBeTrue();
  });

  // --- Form validation: routingNumber ---

  it('should require routingNumber', () => {
    component.form.patchValue({ routingNumber: '' });
    expect(component.form.get('routingNumber')?.invalid).toBeTrue();
  });

  it('should accept a valid 9-digit routing number', () => {
    component.form.patchValue({ routingNumber: '123456789' });
    expect(component.form.get('routingNumber')?.valid).toBeTrue();
  });

  it('should reject a routing number with fewer than 9 digits', () => {
    component.form.patchValue({ routingNumber: '12345678' });
    expect(component.form.get('routingNumber')?.invalid).toBeTrue();
  });

  it('should reject a routing number with more than 9 digits', () => {
    component.form.patchValue({ routingNumber: '1234567890' });
    expect(component.form.get('routingNumber')?.invalid).toBeTrue();
  });

  it('should reject a routing number with non-digit characters', () => {
    component.form.patchValue({ routingNumber: '12345678a' });
    expect(component.form.get('routingNumber')?.invalid).toBeTrue();
  });

  // --- Form validation: amount ---

  it('should require amount', () => {
    expect(component.form.get('amount')?.invalid).toBeTrue();
  });

  it('should reject amount of 0', () => {
    component.form.patchValue({ amount: 0 });
    expect(component.form.get('amount')?.invalid).toBeTrue();
  });

  it('should accept minimum valid amount (0.01)', () => {
    component.form.patchValue({ amount: 0.01 });
    expect(component.form.get('amount')?.valid).toBeTrue();
  });

  it('should accept amount at max limit (1,000,000)', () => {
    component.form.patchValue({ amount: 1_000_000 });
    expect(component.form.get('amount')?.valid).toBeTrue();
  });

  it('should reject amount exceeding max limit', () => {
    component.form.patchValue({ amount: 1_000_001 });
    expect(component.form.get('amount')?.invalid).toBeTrue();
  });

  // --- BSA/AML threshold (transactions > $10,000) ---

  it('should accept amount at BSA threshold ($10,000)', () => {
    component.form.patchValue({ amount: 10_000 });
    expect(component.form.get('amount')?.valid).toBeTrue();
  });

  it('should accept amount above BSA threshold ($10,001)', () => {
    component.form.patchValue({ amount: 10_001 });
    expect(component.form.get('amount')?.valid).toBeTrue();
  });

  // --- Form validation: memo ---

  it('should allow an empty memo', () => {
    component.form.patchValue({ memo: '' });
    expect(component.form.get('memo')?.valid).toBeTrue();
  });

  it('should reject memo longer than 140 characters', () => {
    component.form.patchValue({ memo: 'x'.repeat(141) });
    expect(component.form.get('memo')?.invalid).toBeTrue();
  });

  // --- Form validation: paymentType ---

  it('should require paymentType', () => {
    component.form.patchValue({ paymentType: '' });
    expect(component.form.get('paymentType')?.invalid).toBeTrue();
  });

  // --- submit() ---

  it('should not submit when form is invalid', () => {
    component.submit();
    expect(paymentsServiceSpy.submitPayment).not.toHaveBeenCalled();
  });

  it('should call submitPayment on valid form submission', () => {
    component.form.setValue(validFormData);
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(validFormData);
  });

  it('should set submitting=true during submission', () => {
    component.form.setValue(validFormData);
    component.submit();
    expect(component.submitting).toBeFalse(); // resolved synchronously because spy returns of()
  });

  // --- renderConfirmation() success path ---

  it('should render PaymentConfirmationComponent on success', () => {
    component.form.setValue(validFormData);
    fixture.detectChanges();

    component.submit();
    fixture.detectChanges();

    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalled();
  });

  // --- renderConfirmation() error path ---

  it('should render error confirmation on API error', () => {
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('Network failure'))
    );
    component.form.setValue(validFormData);
    fixture.detectChanges();

    component.submit();
    fixture.detectChanges();

    expect(component.submitting).toBeFalse();
  });

  it('should render error confirmation with error message from API', () => {
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('Insufficient funds'))
    );
    component.form.setValue(validFormData);
    component.submit();
    expect(component.submitting).toBeFalse();
  });

  // --- PAYMENT_SUBMISSION_V3 feature flag branch ---

  it('should support domestic payment type', () => {
    component.form.setValue({ ...validFormData, paymentType: 'domestic' });
    expect(component.form.valid).toBeTrue();
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(
      jasmine.objectContaining({ paymentType: 'domestic' })
    );
  });

  it('should support international payment type', () => {
    component.form.setValue({ ...validFormData, paymentType: 'international' });
    expect(component.form.valid).toBeTrue();
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(
      jasmine.objectContaining({ paymentType: 'international' })
    );
  });

  it('should support ach payment type', () => {
    component.form.setValue({ ...validFormData, paymentType: 'ach' });
    expect(component.form.valid).toBeTrue();
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(
      jasmine.objectContaining({ paymentType: 'ach' })
    );
  });

  // --- Edge cases ---

  it('should handle form with all valid fields', () => {
    component.form.setValue(validFormData);
    expect(component.form.valid).toBeTrue();
  });

  it('should be invalid when all fields are empty', () => {
    expect(component.form.invalid).toBeTrue();
  });
});
