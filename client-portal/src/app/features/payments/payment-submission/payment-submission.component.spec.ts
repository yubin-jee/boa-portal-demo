// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  REGULATORY CRITICAL — see payment-submission.component.ts              ║
// ║  GB-4471: Coverage target ≥90% for Q2 OCC audit.                       ║
// ╚══════════════════════════════════════════════════════════════════════════╝
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ViewContainerRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PaymentSubmissionComponent } from './payment-submission.component';
import { PaymentsService, PaymentResult } from '../payments.service';
import { PaymentConfirmationComponent } from './payment-confirmation/payment-confirmation.component';

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

  it('should default paymentType to domestic', () => {
    expect(component.form.get('paymentType')?.value).toBe('domestic');
  });

  it('should default amount to null', () => {
    expect(component.form.get('amount')?.value).toBeNull();
  });

  it('should default submitting to false', () => {
    expect(component.submitting).toBeFalse();
  });

  // ── Recipient account number validation ─────────────────────────────────

  it('should require recipientAccountNumber', () => {
    component.form.get('recipientAccountNumber')?.setValue('');
    expect(component.form.get('recipientAccountNumber')?.hasError('required')).toBeTrue();
  });

  it('should reject account numbers shorter than 8 digits', () => {
    component.form.get('recipientAccountNumber')?.setValue('1234567');
    expect(component.form.get('recipientAccountNumber')?.hasError('pattern')).toBeTrue();
  });

  it('should accept 8-digit account numbers', () => {
    component.form.get('recipientAccountNumber')?.setValue('12345678');
    expect(component.form.get('recipientAccountNumber')?.valid).toBeTrue();
  });

  it('should accept 17-digit account numbers', () => {
    component.form.get('recipientAccountNumber')?.setValue('12345678901234567');
    expect(component.form.get('recipientAccountNumber')?.valid).toBeTrue();
  });

  it('should reject account numbers longer than 17 digits', () => {
    component.form.get('recipientAccountNumber')?.setValue('123456789012345678');
    expect(component.form.get('recipientAccountNumber')?.hasError('pattern')).toBeTrue();
  });

  it('should reject non-numeric account numbers', () => {
    component.form.get('recipientAccountNumber')?.setValue('ABCD12345');
    expect(component.form.get('recipientAccountNumber')?.hasError('pattern')).toBeTrue();
  });

  // ── Routing number validation (ABA format: exactly 9 digits) ────────────

  it('should require routingNumber', () => {
    component.form.get('routingNumber')?.setValue('');
    expect(component.form.get('routingNumber')?.hasError('required')).toBeTrue();
  });

  it('should reject routing numbers shorter than 9 digits', () => {
    component.form.get('routingNumber')?.setValue('12345678');
    expect(component.form.get('routingNumber')?.hasError('pattern')).toBeTrue();
  });

  it('should accept exactly 9-digit routing numbers', () => {
    component.form.get('routingNumber')?.setValue('123456789');
    expect(component.form.get('routingNumber')?.valid).toBeTrue();
  });

  it('should reject routing numbers longer than 9 digits', () => {
    component.form.get('routingNumber')?.setValue('1234567890');
    expect(component.form.get('routingNumber')?.hasError('pattern')).toBeTrue();
  });

  it('should reject non-numeric routing numbers', () => {
    component.form.get('routingNumber')?.setValue('12345678A');
    expect(component.form.get('routingNumber')?.hasError('pattern')).toBeTrue();
  });

  // ── Amount validation ───────────────────────────────────────────────────

  it('should require amount', () => {
    component.form.get('amount')?.setValue(null);
    expect(component.form.get('amount')?.hasError('required')).toBeTrue();
  });

  it('should reject amounts below $0.01', () => {
    component.form.get('amount')?.setValue(0);
    expect(component.form.get('amount')?.hasError('min')).toBeTrue();
  });

  it('should accept the minimum amount of $0.01', () => {
    component.form.get('amount')?.setValue(0.01);
    expect(component.form.get('amount')?.errors).toBeNull();
  });

  it('should accept amounts up to $1,000,000', () => {
    component.form.get('amount')?.setValue(1_000_000);
    expect(component.form.get('amount')?.errors).toBeNull();
  });

  it('should reject amounts exceeding $1,000,000', () => {
    component.form.get('amount')?.setValue(1_000_001);
    expect(component.form.get('amount')?.hasError('max')).toBeTrue();
  });

  // ── BSA/AML threshold boundary ($10,000) ────────────────────────────────

  it('should accept amounts just below the BSA/AML threshold ($9,999.99)', () => {
    component.form.get('amount')?.setValue(9999.99);
    expect(component.form.get('amount')?.valid).toBeTrue();
  });

  it('should accept amounts at the BSA/AML threshold ($10,000)', () => {
    component.form.get('amount')?.setValue(10000);
    expect(component.form.get('amount')?.valid).toBeTrue();
  });

  it('should accept amounts above the BSA/AML threshold ($10,001)', () => {
    component.form.get('amount')?.setValue(10001);
    expect(component.form.get('amount')?.valid).toBeTrue();
  });

  // ── Memo validation ─────────────────────────────────────────────────────

  it('should allow an empty memo', () => {
    component.form.get('memo')?.setValue('');
    expect(component.form.get('memo')?.valid).toBeTrue();
  });

  it('should accept memos up to 140 characters', () => {
    component.form.get('memo')?.setValue('A'.repeat(140));
    expect(component.form.get('memo')?.valid).toBeTrue();
  });

  it('should reject memos exceeding 140 characters', () => {
    component.form.get('memo')?.setValue('A'.repeat(141));
    expect(component.form.get('memo')?.hasError('maxlength')).toBeTrue();
  });

  // ── Payment type validation ─────────────────────────────────────────────

  it('should require paymentType', () => {
    component.form.get('paymentType')?.setValue('');
    expect(component.form.get('paymentType')?.hasError('required')).toBeTrue();
  });

  it('should accept domestic payment type', () => {
    component.form.get('paymentType')?.setValue('domestic');
    expect(component.form.get('paymentType')?.valid).toBeTrue();
  });

  it('should accept international payment type', () => {
    component.form.get('paymentType')?.setValue('international');
    expect(component.form.get('paymentType')?.valid).toBeTrue();
  });

  it('should accept ach payment type', () => {
    component.form.get('paymentType')?.setValue('ach');
    expect(component.form.get('paymentType')?.valid).toBeTrue();
  });

  // ── Form-level validation ───────────────────────────────────────────────

  it('should be invalid when form is empty (default state)', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('should be valid with all required fields properly filled', () => {
    fillValidForm();
    expect(component.form.valid).toBeTrue();
  });

  // ── Submit method: guard against invalid form ───────────────────────────

  it('should not call PaymentsService when form is invalid', () => {
    component.submit();
    expect(paymentsServiceSpy.submitPayment).not.toHaveBeenCalled();
  });

  it('should not change submitting state when form is invalid', () => {
    component.submit();
    expect(component.submitting).toBeFalse();
  });

  // ── Submit method: successful payment ───────────────────────────────────

  it('should set submitting to true while payment is in progress', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(of<PaymentResult>({
      success: true,
      referenceId: 'GB-PAY-20260101-00000001',
    }).pipe(delay(100)));

    component.submit();
    expect(component.submitting).toBeTrue();
  });

  it('should call submitPayment with form values on valid submit', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(of<PaymentResult>({
      success: true,
      referenceId: 'GB-PAY-20260101-00000001',
    }));

    component.submit();

    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        recipientAccountNumber: '12345678',
        routingNumber: '123456789',
        amount: 500,
        memo: 'Test payment',
        paymentType: 'domestic',
      })
    );
  });

  it('should reset submitting to false after successful payment', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(of<PaymentResult>({
      success: true,
      referenceId: 'GB-PAY-20260101-00000001',
    }));

    component.submit();
    expect(component.submitting).toBeFalse();
  });

  // ── Submit method: failed payment (API returns error result) ────────────

  it('should reset submitting to false after API error', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    component.submit();
    expect(component.submitting).toBeFalse();
  });

  // ── renderConfirmation: dynamic component rendering ─────────────────────

  it('should render PaymentConfirmationComponent on success', () => {
    fillValidForm();
    const mockResult: PaymentResult = { success: true, referenceId: 'GB-PAY-20260101-00000001' };
    paymentsServiceSpy.submitPayment.and.returnValue(of(mockResult));

    // Set up the ViewContainerRef mock
    const mockRef = { instance: { result: null as PaymentResult | null } };
    const mockVcr = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    mockVcr.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockVcr;

    component.submit();

    expect((mockVcr.createComponent as jasmine.Spy).calls.mostRecent().args[0]).toBe(PaymentConfirmationComponent);
    expect(mockRef.instance.result).toEqual(mockResult);
  });

  it('should render PaymentConfirmationComponent on error', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('Service unavailable'))
    );

    const mockRef = { instance: { result: null as PaymentResult | null } };
    const mockVcr = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    mockVcr.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockVcr;

    component.submit();

    expect((mockVcr.createComponent as jasmine.Spy).calls.mostRecent().args[0]).toBe(PaymentConfirmationComponent);
    expect(mockRef.instance.result?.success).toBeFalse();
    expect(mockRef.instance.result?.error).toBe('Service unavailable');
  });

  it('should clear confirmationHost before rendering new result', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(of<PaymentResult>({
      success: true,
      referenceId: 'GB-PAY-20260101-00000002',
    }));

    const mockRef = { instance: { result: null as PaymentResult | null } };
    const mockVcr = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    mockVcr.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockVcr;

    component.submit();

    // clear is called once in submit() (confirmationHost?.clear()) and once in renderConfirmation()
    expect(mockVcr.clear).toHaveBeenCalled();
  });

  it('should not throw when confirmationHost is undefined', () => {
    const result: PaymentResult = { success: true, referenceId: 'REF' };
    // Simulate undefined confirmationHost (e.g., before ViewChild resolved)
    component.confirmationHost = undefined as any;
    expect(() => component.renderConfirmation(result)).not.toThrow();
  });

  // ── Submit with BSA/AML threshold amount ($10,000+) ─────────────────────

  it('should submit payment at BSA/AML threshold ($10,000)', () => {
    fillValidForm();
    component.form.get('amount')?.setValue(10000);
    paymentsServiceSpy.submitPayment.and.returnValue(of<PaymentResult>({
      success: true,
      referenceId: 'GB-PAY-20260101-AML-REVIEW',
    }));

    const mockRef = { instance: { result: null as PaymentResult | null } };
    const mockVcr = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    mockVcr.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockVcr;

    component.submit();

    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(
      jasmine.objectContaining({ amount: 10000 })
    );
    expect(component.submitting).toBeFalse();
  });

  it('should submit payment above BSA/AML threshold ($50,000)', () => {
    fillValidForm();
    component.form.get('amount')?.setValue(50000);
    paymentsServiceSpy.submitPayment.and.returnValue(of<PaymentResult>({
      success: true,
      referenceId: 'GB-PAY-20260101-AML-50K',
    }));

    const mockRef = { instance: { result: null as PaymentResult | null } };
    const mockVcr = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    mockVcr.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockVcr;

    component.submit();

    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(
      jasmine.objectContaining({ amount: 50000 })
    );
  });

  // ── Submit with different payment types ─────────────────────────────────

  it('should submit international wire payment', () => {
    fillValidForm();
    component.form.get('paymentType')?.setValue('international');
    paymentsServiceSpy.submitPayment.and.returnValue(of<PaymentResult>({
      success: true,
      referenceId: 'GB-PAY-INTL-001',
    }));

    component.submit();

    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(
      jasmine.objectContaining({ paymentType: 'international' })
    );
  });

  it('should submit ACH transfer', () => {
    fillValidForm();
    component.form.get('paymentType')?.setValue('ach');
    paymentsServiceSpy.submitPayment.and.returnValue(of<PaymentResult>({
      success: true,
      referenceId: 'GB-PAY-ACH-001',
    }));

    component.submit();

    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(
      jasmine.objectContaining({ paymentType: 'ach' })
    );
  });

  // ── Error rendering with error message ──────────────────────────────────

  it('should pass error message from HTTP error to confirmation component', () => {
    fillValidForm();
    const errorMsg = 'Transaction limit exceeded';
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error(errorMsg))
    );

    const mockRef = { instance: { result: null as PaymentResult | null } };
    const mockVcr = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    mockVcr.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockVcr;

    component.submit();

    expect(mockRef.instance.result).toEqual({
      success: false,
      referenceId: null,
      error: errorMsg,
    });
  });

  it('should pass null referenceId on error', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('fail'))
    );

    const mockRef = { instance: { result: null as PaymentResult | null } };
    const mockVcr = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    mockVcr.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockVcr;

    component.submit();

    expect(mockRef.instance.result?.referenceId).toBeNull();
  });

  // ── Multiple submissions ────────────────────────────────────────────────

  it('should allow re-submission after first success', () => {
    fillValidForm();
    paymentsServiceSpy.submitPayment.and.returnValue(of<PaymentResult>({
      success: true,
      referenceId: 'GB-PAY-001',
    }));

    const mockRef = { instance: { result: null as PaymentResult | null } };
    const mockVcr = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    mockVcr.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockVcr;

    component.submit();
    expect(component.submitting).toBeFalse();

    // Second submission
    paymentsServiceSpy.submitPayment.and.returnValue(of<PaymentResult>({
      success: true,
      referenceId: 'GB-PAY-002',
    }));

    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledTimes(2);
  });

  // ── Helper ──────────────────────────────────────────────────────────────

  function fillValidForm(): void {
    component.form.setValue({
      recipientAccountNumber: '12345678',
      routingNumber: '123456789',
      amount: 500,
      memo: 'Test payment',
      paymentType: 'domestic',
    });
  }
});
