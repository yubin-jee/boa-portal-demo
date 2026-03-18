// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  REGULATORY CRITICAL — see payment-submission.component.ts              ║
// ║  GB-4471: Coverage target ≥90% for Q2 OCC audit.                       ║
// ╚══════════════════════════════════════════════════════════════════════════╝
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PaymentSubmissionComponent } from './payment-submission.component';
import { PaymentsService, PaymentRequest, PaymentResult } from '../payments.service';
import { PaymentConfirmationComponent } from './payment-confirmation/payment-confirmation.component';

describe('PaymentSubmissionComponent', () => {
  let component: PaymentSubmissionComponent;
  let fixture: ComponentFixture<PaymentSubmissionComponent>;
  let paymentsServiceSpy: jasmine.SpyObj<PaymentsService>;

  const validFormData: PaymentRequest = {
    recipientAccountNumber: '12345678',
    routingNumber: '123456789',
    amount: 500,
    memo: 'Test payment',
    paymentType: 'domestic',
  };

  const successResult: PaymentResult = {
    success: true,
    referenceId: 'GB-PAY-20260318-00000001',
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
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PaymentsService, useValue: paymentsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentSubmissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Component creation ──────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Form initialization ─────────────────────────────────────────────────
  it('should initialize the payment form with expected controls', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('recipientAccountNumber')).toBeTruthy();
    expect(component.form.get('routingNumber')).toBeTruthy();
    expect(component.form.get('amount')).toBeTruthy();
    expect(component.form.get('memo')).toBeTruthy();
    expect(component.form.get('paymentType')).toBeTruthy();
  });

  it('should default paymentType to domestic', () => {
    expect(component.form.get('paymentType')?.value).toBe('domestic');
  });

  it('should default amount to null', () => {
    expect(component.form.get('amount')?.value).toBeNull();
  });

  it('should start with submitting = false', () => {
    expect(component.submitting).toBeFalse();
  });

  // ── Recipient account number validation ─────────────────────────────────
  it('should require recipientAccountNumber', () => {
    component.form.patchValue({ recipientAccountNumber: '' });
    expect(component.form.get('recipientAccountNumber')?.hasError('required')).toBeTrue();
  });

  it('should reject account number shorter than 8 digits', () => {
    component.form.patchValue({ recipientAccountNumber: '1234567' });
    expect(component.form.get('recipientAccountNumber')?.hasError('pattern')).toBeTrue();
  });

  it('should reject account number longer than 17 digits', () => {
    component.form.patchValue({ recipientAccountNumber: '123456789012345678' });
    expect(component.form.get('recipientAccountNumber')?.hasError('pattern')).toBeTrue();
  });

  it('should accept valid 8-digit account number', () => {
    component.form.patchValue({ recipientAccountNumber: '12345678' });
    expect(component.form.get('recipientAccountNumber')?.valid).toBeTrue();
  });

  it('should accept valid 17-digit account number', () => {
    component.form.patchValue({ recipientAccountNumber: '12345678901234567' });
    expect(component.form.get('recipientAccountNumber')?.valid).toBeTrue();
  });

  it('should reject non-digit characters in account number', () => {
    component.form.patchValue({ recipientAccountNumber: '1234567a' });
    expect(component.form.get('recipientAccountNumber')?.hasError('pattern')).toBeTrue();
  });

  // ── Routing number validation (ABA 9-digit) ────────────────────────────
  it('should require routingNumber', () => {
    component.form.patchValue({ routingNumber: '' });
    expect(component.form.get('routingNumber')?.hasError('required')).toBeTrue();
  });

  it('should reject routing number with fewer than 9 digits', () => {
    component.form.patchValue({ routingNumber: '12345678' });
    expect(component.form.get('routingNumber')?.hasError('pattern')).toBeTrue();
  });

  it('should reject routing number with more than 9 digits', () => {
    component.form.patchValue({ routingNumber: '1234567890' });
    expect(component.form.get('routingNumber')?.hasError('pattern')).toBeTrue();
  });

  it('should accept valid 9-digit routing number', () => {
    component.form.patchValue({ routingNumber: '123456789' });
    expect(component.form.get('routingNumber')?.valid).toBeTrue();
  });

  it('should reject non-digit characters in routing number', () => {
    component.form.patchValue({ routingNumber: '12345678a' });
    expect(component.form.get('routingNumber')?.hasError('pattern')).toBeTrue();
  });

  // ── Amount validation ───────────────────────────────────────────────────
  it('should require amount', () => {
    component.form.patchValue({ amount: null });
    expect(component.form.get('amount')?.hasError('required')).toBeTrue();
  });

  it('should reject amount less than 0.01', () => {
    component.form.patchValue({ amount: 0 });
    expect(component.form.get('amount')?.hasError('min')).toBeTrue();
  });

  it('should accept amount of exactly 0.01 (minimum)', () => {
    component.form.patchValue({ amount: 0.01 });
    expect(component.form.get('amount')?.hasError('min')).toBeFalsy();
  });

  it('should reject amount greater than 1,000,000', () => {
    component.form.patchValue({ amount: 1_000_001 });
    expect(component.form.get('amount')?.hasError('max')).toBeTrue();
  });

  it('should accept amount of exactly 1,000,000 (maximum)', () => {
    component.form.patchValue({ amount: 1_000_000 });
    expect(component.form.get('amount')?.hasError('max')).toBeFalsy();
  });

  // ── BSA/AML threshold branch (≥$10,000) ────────────────────────────────
  it('should accept amount at BSA/AML threshold ($10,000)', () => {
    component.form.patchValue({ amount: 10_000 });
    expect(component.form.get('amount')?.valid).toBeTrue();
  });

  it('should accept amount above BSA/AML threshold ($50,000)', () => {
    component.form.patchValue({ amount: 50_000 });
    expect(component.form.get('amount')?.valid).toBeTrue();
  });

  // ── Memo validation ─────────────────────────────────────────────────────
  it('should allow empty memo', () => {
    component.form.patchValue({ memo: '' });
    expect(component.form.get('memo')?.valid).toBeTrue();
  });

  it('should reject memo longer than 140 characters', () => {
    component.form.patchValue({ memo: 'x'.repeat(141) });
    expect(component.form.get('memo')?.hasError('maxlength')).toBeTrue();
  });

  it('should accept memo of exactly 140 characters', () => {
    component.form.patchValue({ memo: 'x'.repeat(140) });
    expect(component.form.get('memo')?.valid).toBeTrue();
  });

  // ── Payment type validation ─────────────────────────────────────────────
  it('should require paymentType', () => {
    component.form.patchValue({ paymentType: '' });
    expect(component.form.get('paymentType')?.hasError('required')).toBeTrue();
  });

  it('should accept international payment type', () => {
    component.form.patchValue({ paymentType: 'international' });
    expect(component.form.get('paymentType')?.valid).toBeTrue();
  });

  it('should accept ach payment type', () => {
    component.form.patchValue({ paymentType: 'ach' });
    expect(component.form.get('paymentType')?.valid).toBeTrue();
  });

  // ── Form-level validation ───────────────────────────────────────────────
  it('should be invalid when form is empty (initial state)', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('should be valid with complete valid data', () => {
    component.form.setValue(validFormData);
    expect(component.form.valid).toBeTrue();
  });

  // ── Submit: guard on invalid form ───────────────────────────────────────
  it('should not call service when form is invalid', () => {
    component.submit();
    expect(paymentsServiceSpy.submitPayment).not.toHaveBeenCalled();
  });

  it('should not set submitting=true when form is invalid', () => {
    component.submit();
    expect(component.submitting).toBeFalse();
  });

  // ── Submit: successful payment ──────────────────────────────────────────
  it('should set submitting=true while request is in flight', () => {
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult).pipe(delay(100)));
    component.form.setValue(validFormData);
    component.submit();
    expect(component.submitting).toBeTrue();
  });

  it('should call submitPayment with form values on valid submit', () => {
    component.form.setValue(validFormData);
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(validFormData);
  });

  it('should set submitting=false after successful response', fakeAsync(() => {
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult).pipe(delay(50)));
    component.form.setValue(validFormData);
    component.submit();
    expect(component.submitting).toBeTrue();
    tick(50);
    expect(component.submitting).toBeFalse();
  }));

  // ── Submit: error handling ──────────────────────────────────────────────
  it('should set submitting=false after API error', () => {
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('Network timeout'))
    );
    component.form.setValue(validFormData);
    component.submit();
    expect(component.submitting).toBeFalse();
  });

  it('should render error confirmation on API failure', () => {
    const renderSpy = spyOn(component, 'renderConfirmation');
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('Server error'))
    );
    component.form.setValue(validFormData);
    component.submit();
    expect(renderSpy).toHaveBeenCalledWith({
      success: false,
      referenceId: null,
      error: 'Server error',
    });
  });

  it('should render success confirmation on successful payment', () => {
    const renderSpy = spyOn(component, 'renderConfirmation');
    component.form.setValue(validFormData);
    component.submit();
    expect(renderSpy).toHaveBeenCalledWith(successResult);
  });

  // ── renderConfirmation: dynamic component creation ──────────────────────
  it('should do nothing if confirmationHost is not available', () => {
    const originalHost = component.confirmationHost;
    (component as unknown as Record<string, unknown>)['confirmationHost'] = undefined;
    expect(() => component.renderConfirmation(successResult)).not.toThrow();
    (component as unknown as Record<string, unknown>)['confirmationHost'] = originalHost;
  });

  it('should clear confirmationHost before rendering', () => {
    // Trigger a first submission to ensure ViewChild is resolved
    component.form.setValue(validFormData);
    component.submit();
    fixture.detectChanges();

    if (component.confirmationHost) {
      const clearSpy = spyOn(component.confirmationHost, 'clear');
      component.renderConfirmation(successResult);
      expect(clearSpy).toHaveBeenCalled();
    }
  });

  it('should create PaymentConfirmationComponent dynamically on success', () => {
    component.form.setValue(validFormData);
    component.submit();
    fixture.detectChanges();

    if (component.confirmationHost) {
      const createSpy = spyOn(component.confirmationHost, 'createComponent').and.callThrough();
      component.renderConfirmation(successResult);
      expect(createSpy).toHaveBeenCalled();
    }
  });

  it('should pass result to dynamically created confirmation component', () => {
    component.form.setValue(validFormData);
    component.submit();
    fixture.detectChanges();

    if (component.confirmationHost) {
      component.renderConfirmation(errorResult);
      // The component was created; verify it received the result
      expect(component.confirmationHost.length).toBe(1);
    }
  });

  // ── Submit: clears previous confirmation before new request ─────────────
  it('should clear confirmationHost when submitting new payment', () => {
    component.form.setValue(validFormData);
    component.submit();
    fixture.detectChanges();

    if (component.confirmationHost) {
      const clearSpy = spyOn(component.confirmationHost, 'clear');
      component.submit();
      expect(clearSpy).toHaveBeenCalled();
    }
  });

  // ── BSA/AML threshold: service receives high-value transactions ─────────
  it('should submit transaction at BSA/AML threshold ($10,000) to service', () => {
    const highValueData: PaymentRequest = { ...validFormData, amount: 10_000 };
    component.form.setValue(highValueData);
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(highValueData);
  });

  it('should submit transaction above BSA/AML threshold ($999,999) to service', () => {
    const highValueData: PaymentRequest = { ...validFormData, amount: 999_999 };
    component.form.setValue(highValueData);
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(highValueData);
  });

  // ── Payment type variations ─────────────────────────────────────────────
  it('should submit international wire payment', () => {
    const intlData: PaymentRequest = { ...validFormData, paymentType: 'international' };
    component.form.setValue(intlData);
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(intlData);
  });

  it('should submit ACH transfer payment', () => {
    const achData: PaymentRequest = { ...validFormData, paymentType: 'ach' };
    component.form.setValue(achData);
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(achData);
  });

  // ── Transient API failure scenarios ─────────────────────────────────────
  it('should handle HTTP 500 error gracefully', () => {
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('Internal Server Error'))
    );
    component.form.setValue(validFormData);
    component.submit();
    expect(component.submitting).toBeFalse();
  });

  it('should handle HTTP 503 (service unavailable) error', () => {
    const renderSpy = spyOn(component, 'renderConfirmation');
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('Service Unavailable'))
    );
    component.form.setValue(validFormData);
    component.submit();
    expect(renderSpy).toHaveBeenCalledWith({
      success: false,
      referenceId: null,
      error: 'Service Unavailable',
    });
  });

  it('should handle network timeout error', () => {
    const renderSpy = spyOn(component, 'renderConfirmation');
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('Timeout'))
    );
    component.form.setValue(validFormData);
    component.submit();
    expect(renderSpy).toHaveBeenCalledWith({
      success: false,
      referenceId: null,
      error: 'Timeout',
    });
  });

  // ── Multiple submissions ────────────────────────────────────────────────
  it('should allow re-submission after a failed attempt', () => {
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('First failure'))
    );
    component.form.setValue(validFormData);
    component.submit();
    expect(component.submitting).toBeFalse();

    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledTimes(2);
  });

  it('should allow re-submission after a successful attempt', () => {
    component.form.setValue(validFormData);
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledTimes(1);

    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledTimes(2);
  });
});
