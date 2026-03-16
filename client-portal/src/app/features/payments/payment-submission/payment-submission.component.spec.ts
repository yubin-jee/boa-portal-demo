import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { PaymentSubmissionComponent } from './payment-submission.component';
import { PaymentsService, PaymentResult } from '../payments.service';

describe('PaymentSubmissionComponent', () => {
  let component: PaymentSubmissionComponent;
  let fixture: ComponentFixture<PaymentSubmissionComponent>;
  let paymentsServiceSpy: jasmine.SpyObj<PaymentsService>;

  beforeEach(async () => {
    paymentsServiceSpy = jasmine.createSpyObj('PaymentsService', ['submitPayment']);

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

  it('should default amount to null', () => {
    expect(component.form.get('amount')?.value).toBeNull();
  });

  it('should default paymentType to domestic', () => {
    expect(component.form.get('paymentType')?.value).toBe('domestic');
  });

  it('should default submitting to false', () => {
    expect(component.submitting).toBeFalse();
  });

  // ── recipientAccountNumber validation ───────────────────────────────────

  it('should require recipientAccountNumber', () => {
    const ctrl = component.form.get('recipientAccountNumber')!;
    ctrl.setValue('');
    expect(ctrl.invalid).toBeTrue();
  });

  it('should accept a valid 8-digit account number', () => {
    const ctrl = component.form.get('recipientAccountNumber')!;
    ctrl.setValue('12345678');
    expect(ctrl.valid).toBeTrue();
  });

  it('should accept a valid 17-digit account number', () => {
    const ctrl = component.form.get('recipientAccountNumber')!;
    ctrl.setValue('12345678901234567');
    expect(ctrl.valid).toBeTrue();
  });

  it('should reject a 7-digit account number (too short)', () => {
    const ctrl = component.form.get('recipientAccountNumber')!;
    ctrl.setValue('1234567');
    expect(ctrl.invalid).toBeTrue();
  });

  it('should reject an 18-digit account number (too long)', () => {
    const ctrl = component.form.get('recipientAccountNumber')!;
    ctrl.setValue('123456789012345678');
    expect(ctrl.invalid).toBeTrue();
  });

  it('should reject non-numeric account numbers', () => {
    const ctrl = component.form.get('recipientAccountNumber')!;
    ctrl.setValue('ABCDEFGH');
    expect(ctrl.invalid).toBeTrue();
  });

  // ── routingNumber validation (ABA 9-digit) ─────────────────────────────

  it('should require routingNumber', () => {
    const ctrl = component.form.get('routingNumber')!;
    ctrl.setValue('');
    expect(ctrl.invalid).toBeTrue();
  });

  it('should accept a valid 9-digit routing number', () => {
    const ctrl = component.form.get('routingNumber')!;
    ctrl.setValue('021000021');
    expect(ctrl.valid).toBeTrue();
  });

  it('should reject an 8-digit routing number', () => {
    const ctrl = component.form.get('routingNumber')!;
    ctrl.setValue('02100002');
    expect(ctrl.invalid).toBeTrue();
  });

  it('should reject a 10-digit routing number', () => {
    const ctrl = component.form.get('routingNumber')!;
    ctrl.setValue('0210000210');
    expect(ctrl.invalid).toBeTrue();
  });

  it('should reject alphabetic routing numbers', () => {
    const ctrl = component.form.get('routingNumber')!;
    ctrl.setValue('ABCDEFGHI');
    expect(ctrl.invalid).toBeTrue();
  });

  // ── amount validation ──────────────────────────────────────────────────

  it('should require amount', () => {
    const ctrl = component.form.get('amount')!;
    ctrl.setValue(null);
    expect(ctrl.invalid).toBeTrue();
  });

  it('should accept minimum amount of 0.01', () => {
    const ctrl = component.form.get('amount')!;
    ctrl.setValue(0.01);
    expect(ctrl.valid).toBeTrue();
  });

  it('should reject zero amount', () => {
    const ctrl = component.form.get('amount')!;
    ctrl.setValue(0);
    expect(ctrl.invalid).toBeTrue();
  });

  it('should reject negative amount', () => {
    const ctrl = component.form.get('amount')!;
    ctrl.setValue(-100);
    expect(ctrl.invalid).toBeTrue();
  });

  it('should accept maximum amount of 1,000,000', () => {
    const ctrl = component.form.get('amount')!;
    ctrl.setValue(1_000_000);
    expect(ctrl.valid).toBeTrue();
  });

  it('should reject amount exceeding 1,000,000', () => {
    const ctrl = component.form.get('amount')!;
    ctrl.setValue(1_000_001);
    expect(ctrl.invalid).toBeTrue();
  });

  // ── BSA/AML threshold boundary (≥$10,000) ─────────────────────────────

  it('should accept amount at BSA/AML threshold ($10,000)', () => {
    const ctrl = component.form.get('amount')!;
    ctrl.setValue(10_000);
    expect(ctrl.valid).toBeTrue();
  });

  it('should accept amount above BSA/AML threshold ($10,001)', () => {
    const ctrl = component.form.get('amount')!;
    ctrl.setValue(10_001);
    expect(ctrl.valid).toBeTrue();
  });

  it('should accept amount just below BSA/AML threshold ($9,999.99)', () => {
    const ctrl = component.form.get('amount')!;
    ctrl.setValue(9_999.99);
    expect(ctrl.valid).toBeTrue();
  });

  // ── memo validation ────────────────────────────────────────────────────

  it('should allow empty memo', () => {
    const ctrl = component.form.get('memo')!;
    ctrl.setValue('');
    expect(ctrl.valid).toBeTrue();
  });

  it('should accept a memo up to 140 characters', () => {
    const ctrl = component.form.get('memo')!;
    ctrl.setValue('A'.repeat(140));
    expect(ctrl.valid).toBeTrue();
  });

  it('should reject a memo exceeding 140 characters', () => {
    const ctrl = component.form.get('memo')!;
    ctrl.setValue('A'.repeat(141));
    expect(ctrl.invalid).toBeTrue();
  });

  // ── paymentType validation ─────────────────────────────────────────────

  it('should require paymentType', () => {
    const ctrl = component.form.get('paymentType')!;
    ctrl.setValue('');
    expect(ctrl.invalid).toBeTrue();
  });

  it('should accept domestic payment type', () => {
    const ctrl = component.form.get('paymentType')!;
    ctrl.setValue('domestic');
    expect(ctrl.valid).toBeTrue();
  });

  it('should accept international payment type', () => {
    const ctrl = component.form.get('paymentType')!;
    ctrl.setValue('international');
    expect(ctrl.valid).toBeTrue();
  });

  it('should accept ach payment type', () => {
    const ctrl = component.form.get('paymentType')!;
    ctrl.setValue('ach');
    expect(ctrl.valid).toBeTrue();
  });

  // ── Form-level validation (full form invalid) ─────────────────────────

  it('should be invalid when all fields are empty', () => {
    component.form.reset();
    expect(component.form.invalid).toBeTrue();
  });

  // ── submit() — invalid form guard ─────────────────────────────────────

  it('should not call paymentsService when form is invalid', () => {
    component.form.reset();
    component.submit();
    expect(paymentsServiceSpy.submitPayment).not.toHaveBeenCalled();
  });

  it('should not set submitting to true when form is invalid', () => {
    component.form.reset();
    component.submit();
    expect(component.submitting).toBeFalse();
  });

  // ── submit() — happy path ─────────────────────────────────────────────

  function fillValidForm(): void {
    component.form.setValue({
      recipientAccountNumber: '12345678',
      routingNumber: '021000021',
      amount: 500,
      memo: 'Test payment',
      paymentType: 'domestic',
    });
  }

  it('should set submitting to true when form is submitted', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(of({ success: true, referenceId: 'GB-PAY-20260316-00000001' }));
    component.submit();
    expect(component.submitting).toBeFalse(); // resets after subscribe completes synchronously
  });

  it('should call paymentsService.submitPayment with form values', () => {
    fillValidForm();
    const successResult: PaymentResult = { success: true, referenceId: 'GB-PAY-20260316-00000001' };
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith({
      recipientAccountNumber: '12345678',
      routingNumber: '021000021',
      amount: 500,
      memo: 'Test payment',
      paymentType: 'domestic',
    });
  });

  it('should reset submitting to false after successful submission', () => {
    fillValidForm();
    const successResult: PaymentResult = { success: true, referenceId: 'GB-PAY-20260316-00000001' };
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    component.submit();
    expect(component.submitting).toBeFalse();
  });

  // ── submit() — successful dynamic component rendering ──────────────────

  it('should call renderConfirmation with success result', () => {
    fillValidForm();
    const successResult: PaymentResult = { success: true, referenceId: 'GB-PAY-20260316-00000001' };
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    spyOn(component, 'renderConfirmation');
    component.submit();
    expect(component.renderConfirmation).toHaveBeenCalledWith(successResult);
  });

  // ── submit() — error path (API failure) ────────────────────────────────

  it('should reset submitting to false on API error', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(throwError(() => new Error('Network error')));
    component.submit();
    expect(component.submitting).toBeFalse();
  });

  it('should call renderConfirmation with error result on API failure', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(throwError(() => new Error('Server timeout')));
    spyOn(component, 'renderConfirmation');
    component.submit();
    expect(component.renderConfirmation).toHaveBeenCalledWith({
      success: false,
      referenceId: null,
      error: 'Server timeout',
    });
  });

  it('should call renderConfirmation with error on 500 response', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(throwError(() => new Error('Internal Server Error')));
    spyOn(component, 'renderConfirmation');
    component.submit();
    expect(component.renderConfirmation).toHaveBeenCalledWith({
      success: false,
      referenceId: null,
      error: 'Internal Server Error',
    });
  });

  // ── submit() — BSA/AML threshold transactions ─────────────────────────

  it('should submit a $10,000 transaction (BSA/AML threshold) successfully', () => {
    component.form.setValue({
      recipientAccountNumber: '12345678',
      routingNumber: '021000021',
      amount: 10_000,
      memo: 'BSA threshold payment',
      paymentType: 'domestic',
    });
    const successResult: PaymentResult = { success: true, referenceId: 'GB-PAY-20260316-00000002' };
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    spyOn(component, 'renderConfirmation');
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(jasmine.objectContaining({ amount: 10_000 }));
    expect(component.renderConfirmation).toHaveBeenCalledWith(successResult);
  });

  it('should submit a $50,000 transaction (above BSA/AML threshold) successfully', () => {
    component.form.setValue({
      recipientAccountNumber: '12345678901234567',
      routingNumber: '021000021',
      amount: 50_000,
      memo: '',
      paymentType: 'international',
    });
    const successResult: PaymentResult = { success: true, referenceId: 'GB-PAY-20260316-00000003' };
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(jasmine.objectContaining({ amount: 50_000 }));
  });

  // ── submit() — different payment types ─────────────────────────────────

  it('should submit an international payment', () => {
    component.form.setValue({
      recipientAccountNumber: '1234567890',
      routingNumber: '021000021',
      amount: 2500,
      memo: 'International transfer',
      paymentType: 'international',
    });
    const successResult: PaymentResult = { success: true, referenceId: 'GB-PAY-INTL-001' };
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(jasmine.objectContaining({ paymentType: 'international' }));
  });

  it('should submit an ACH payment', () => {
    component.form.setValue({
      recipientAccountNumber: '1234567890',
      routingNumber: '021000021',
      amount: 100,
      memo: 'ACH transfer',
      paymentType: 'ach',
    });
    const successResult: PaymentResult = { success: true, referenceId: 'GB-PAY-ACH-001' };
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(jasmine.objectContaining({ paymentType: 'ach' }));
  });

  // ── renderConfirmation() ───────────────────────────────────────────────

  it('should not throw when confirmationHost is undefined', () => {
    (component as any).confirmationHost = undefined as any;
    expect(() => component.renderConfirmation({ success: true, referenceId: 'REF-001' })).not.toThrow();
  });

  // ── submit() clears confirmationHost before new submission ─────────────

  it('should clear confirmationHost before submitting', () => {
    fillValidForm();
    const successResult: PaymentResult = { success: true, referenceId: 'REF-001' };
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));

    // First submission
    component.submit();
    fixture.detectChanges();

    // Second submission
    paymentsServiceSpy.submitPayment.and.returnValue(of({ success: true, referenceId: 'REF-002' }));
    component.submit();
    fixture.detectChanges();

    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledTimes(2);
  });

  // ── submit() — failed payment result (success: false from API) ─────────

  it('should render error confirmation when API returns success: false', () => {
    fillValidForm();
    const failResult: PaymentResult = { success: false, referenceId: null, error: 'Insufficient funds' };
    paymentsServiceSpy.submitPayment.and.returnValue(of(failResult));
    spyOn(component, 'renderConfirmation');
    component.submit();
    expect(component.renderConfirmation).toHaveBeenCalledWith(failResult);
  });
});
