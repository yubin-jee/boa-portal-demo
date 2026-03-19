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

  const validFormData = {
    recipientAccountNumber: '12345678',
    routingNumber: '021000021',
    amount: 500,
    memo: 'Test payment',
    paymentType: 'domestic' as const,
  };

  const successResult: PaymentResult = {
    success: true,
    referenceId: 'GB-PAY-20260319-00000001',
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
  it('should initialize the payment form with default values', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('recipientAccountNumber')?.value).toBe('');
    expect(component.form.get('routingNumber')?.value).toBe('');
    expect(component.form.get('amount')?.value).toBeNull();
    expect(component.form.get('memo')?.value).toBe('');
    expect(component.form.get('paymentType')?.value).toBe('domestic');
  });

  it('should start with submitting=false', () => {
    expect(component.submitting).toBeFalse();
  });

  // ── Form validation: recipientAccountNumber ─────────────────────────────
  it('should require recipientAccountNumber', () => {
    const control = component.form.get('recipientAccountNumber')!;
    control.setValue('');
    expect(control.hasError('required')).toBeTrue();
  });

  it('should accept a valid 8-digit account number', () => {
    const control = component.form.get('recipientAccountNumber')!;
    control.setValue('12345678');
    expect(control.valid).toBeTrue();
  });

  it('should accept a valid 17-digit account number', () => {
    const control = component.form.get('recipientAccountNumber')!;
    control.setValue('12345678901234567');
    expect(control.valid).toBeTrue();
  });

  it('should reject account number shorter than 8 digits', () => {
    const control = component.form.get('recipientAccountNumber')!;
    control.setValue('1234567');
    expect(control.hasError('pattern')).toBeTrue();
  });

  it('should reject account number longer than 17 digits', () => {
    const control = component.form.get('recipientAccountNumber')!;
    control.setValue('123456789012345678');
    expect(control.hasError('pattern')).toBeTrue();
  });

  it('should reject non-numeric account number', () => {
    const control = component.form.get('recipientAccountNumber')!;
    control.setValue('ABCDEFGH');
    expect(control.hasError('pattern')).toBeTrue();
  });

  // ── Form validation: routingNumber (ABA 9-digit) ───────────────────────
  it('should require routingNumber', () => {
    const control = component.form.get('routingNumber')!;
    control.setValue('');
    expect(control.hasError('required')).toBeTrue();
  });

  it('should accept a valid 9-digit routing number', () => {
    const control = component.form.get('routingNumber')!;
    control.setValue('021000021');
    expect(control.valid).toBeTrue();
  });

  it('should reject routing number with fewer than 9 digits', () => {
    const control = component.form.get('routingNumber')!;
    control.setValue('02100002');
    expect(control.hasError('pattern')).toBeTrue();
  });

  it('should reject routing number with more than 9 digits', () => {
    const control = component.form.get('routingNumber')!;
    control.setValue('0210000210');
    expect(control.hasError('pattern')).toBeTrue();
  });

  it('should reject routing number with letters', () => {
    const control = component.form.get('routingNumber')!;
    control.setValue('02100002A');
    expect(control.hasError('pattern')).toBeTrue();
  });

  // ── Form validation: amount ─────────────────────────────────────────────
  it('should require amount', () => {
    const control = component.form.get('amount')!;
    control.setValue(null);
    expect(control.hasError('required')).toBeTrue();
  });

  it('should reject amount below $0.01', () => {
    const control = component.form.get('amount')!;
    control.setValue(0);
    expect(control.hasError('min')).toBeTrue();
  });

  it('should accept minimum amount of $0.01', () => {
    const control = component.form.get('amount')!;
    control.setValue(0.01);
    expect(control.valid).toBeTrue();
  });

  it('should accept maximum amount of $1,000,000', () => {
    const control = component.form.get('amount')!;
    control.setValue(1_000_000);
    expect(control.valid).toBeTrue();
  });

  it('should reject amount above $1,000,000', () => {
    const control = component.form.get('amount')!;
    control.setValue(1_000_001);
    expect(control.hasError('max')).toBeTrue();
  });

  // ── BSA/AML threshold boundary ($10,000) ────────────────────────────────
  it('should accept amount just below BSA/AML threshold ($9,999.99)', () => {
    const control = component.form.get('amount')!;
    control.setValue(9999.99);
    expect(control.valid).toBeTrue();
  });

  it('should accept amount at BSA/AML threshold ($10,000)', () => {
    const control = component.form.get('amount')!;
    control.setValue(10000);
    expect(control.valid).toBeTrue();
  });

  it('should accept amount above BSA/AML threshold ($10,000.01)', () => {
    const control = component.form.get('amount')!;
    control.setValue(10000.01);
    expect(control.valid).toBeTrue();
  });

  // ── Form validation: memo ───────────────────────────────────────────────
  it('should allow empty memo', () => {
    const control = component.form.get('memo')!;
    control.setValue('');
    expect(control.valid).toBeTrue();
  });

  it('should accept memo up to 140 characters', () => {
    const control = component.form.get('memo')!;
    control.setValue('a'.repeat(140));
    expect(control.valid).toBeTrue();
  });

  it('should reject memo longer than 140 characters', () => {
    const control = component.form.get('memo')!;
    control.setValue('a'.repeat(141));
    expect(control.hasError('maxlength')).toBeTrue();
  });

  // ── Form validation: paymentType ────────────────────────────────────────
  it('should require paymentType', () => {
    const control = component.form.get('paymentType')!;
    control.setValue('');
    expect(control.hasError('required')).toBeTrue();
  });

  it('should default paymentType to domestic', () => {
    expect(component.form.get('paymentType')?.value).toBe('domestic');
  });

  it('should accept international payment type', () => {
    const control = component.form.get('paymentType')!;
    control.setValue('international');
    expect(control.valid).toBeTrue();
  });

  it('should accept ach payment type', () => {
    const control = component.form.get('paymentType')!;
    control.setValue('ach');
    expect(control.valid).toBeTrue();
  });

  // ── Overall form validity ───────────────────────────────────────────────
  it('should be invalid when all fields are empty', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('should be valid with all required fields filled correctly', () => {
    component.form.setValue(validFormData);
    expect(component.form.valid).toBeTrue();
  });

  // ── Submit: guard against invalid form ──────────────────────────────────
  it('should not call submitPayment when form is invalid', () => {
    component.submit();
    expect(paymentsServiceSpy.submitPayment).not.toHaveBeenCalled();
  });

  it('should not change submitting flag when form is invalid', () => {
    component.submit();
    expect(component.submitting).toBeFalse();
  });

  // ── Submit: happy path ──────────────────────────────────────────────────
  it('should set submitting=true when submitting a valid form', () => {
    component.form.setValue(validFormData);
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult).pipe(delay(100)));
    component.submit();
    expect(component.submitting).toBeTrue();
  });

  it('should call submitPayment with form values', () => {
    component.form.setValue(validFormData);
    component.submit();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalledWith(validFormData);
  });

  it('should set submitting=false after successful submission', fakeAsync(() => {
    component.form.setValue(validFormData);
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    component.submit();
    tick();
    expect(component.submitting).toBeFalse();
  }));

  // ── Submit: error path ──────────────────────────────────────────────────
  it('should set submitting=false after API error', fakeAsync(() => {
    component.form.setValue(validFormData);
    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('Network timeout'))
    );
    component.submit();
    tick();
    expect(component.submitting).toBeFalse();
  }));

  it('should render error confirmation on API failure', fakeAsync(() => {
    component.form.setValue(validFormData);
    const mockHost = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    const mockRef = { instance: { result: null as unknown } };
    mockHost.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockHost;

    paymentsServiceSpy.submitPayment.and.returnValue(
      throwError(() => new Error('Server error'))
    );
    component.submit();
    tick();
    expect(mockHost.createComponent).toHaveBeenCalled();
    expect(mockRef.instance.result).toEqual({
      success: false,
      referenceId: null,
      error: 'Server error',
    });
  }));

  // ── Submit: BSA/AML threshold submission ($10,000+) ─────────────────────
  it('should successfully submit a payment at $10,000 (BSA/AML threshold)', fakeAsync(() => {
    const bsaFormData = { ...validFormData, amount: 10000 };
    const bsaResult: PaymentResult = { success: true, referenceId: 'GB-PAY-20260319-BSA00001' };
    paymentsServiceSpy.submitPayment.and.returnValue(of(bsaResult));

    component.form.setValue(bsaFormData);
    component.submit();
    tick();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalled();
    expect(component.submitting).toBeFalse();
  }));

  it('should successfully submit a payment above BSA/AML threshold ($50,000)', fakeAsync(() => {
    const bsaFormData = { ...validFormData, amount: 50000 };
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));

    component.form.setValue(bsaFormData);
    component.submit();
    tick();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalled();
    expect(component.submitting).toBeFalse();
  }));

  // ── Dynamic component rendering (renderConfirmation) ────────────────────
  it('should render PaymentConfirmationComponent on success', fakeAsync(() => {
    component.form.setValue(validFormData);
    const mockHost = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    const mockRef = { instance: { result: null as unknown } };
    mockHost.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockHost;

    component.submit();
    tick();
    expect(mockHost.createComponent).toHaveBeenCalled();
    expect(mockRef.instance.result).toEqual(successResult);
  }));

  it('should clear confirmationHost before rendering new result', fakeAsync(() => {
    component.form.setValue(validFormData);
    const mockHost = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    const mockRef = { instance: { result: null as unknown } };
    mockHost.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockHost;

    component.submit();
    tick();
    // clear is called at start of submit and inside renderConfirmation
    expect(mockHost.clear).toHaveBeenCalled();
  }));

  it('should not throw when confirmationHost is undefined during renderConfirmation', () => {
    component.confirmationHost = undefined as unknown as ViewContainerRef;
    expect(() => component.renderConfirmation(successResult)).not.toThrow();
  });

  // ── Payment type variations ─────────────────────────────────────────────
  it('should submit international wire payment', fakeAsync(() => {
    const intlData = { ...validFormData, paymentType: 'international' as const };
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    component.form.setValue(intlData);
    component.submit();
    tick();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalled();
  }));

  it('should submit ACH payment', fakeAsync(() => {
    const achData = { ...validFormData, paymentType: 'ach' as const };
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    component.form.setValue(achData);
    component.submit();
    tick();
    expect(paymentsServiceSpy.submitPayment).toHaveBeenCalled();
  }));

  // ── Confirmation host clearing on resubmit ──────────────────────────────
  it('should clear confirmationHost before a new submission', fakeAsync(() => {
    component.form.setValue(validFormData);
    const mockHost = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    const mockRef = { instance: { result: null as unknown } };
    mockHost.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockHost;

    component.submit();
    tick();
    mockHost.clear.calls.reset();

    // Submit again
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult));
    component.submit();
    tick();
    expect(mockHost.clear).toHaveBeenCalled();
  }));

  // ── Edge case: error result with custom message ─────────────────────────
  it('should pass error result with custom error message to confirmation', fakeAsync(() => {
    component.form.setValue(validFormData);
    paymentsServiceSpy.submitPayment.and.returnValue(of(errorResult));

    const mockHost = jasmine.createSpyObj<ViewContainerRef>('ViewContainerRef', ['clear', 'createComponent']);
    const mockRef = { instance: { result: null as unknown } };
    mockHost.createComponent.and.returnValue(mockRef as any);
    component.confirmationHost = mockHost;

    component.submit();
    tick();
    expect(mockRef.instance.result).toEqual(errorResult);
  }));

  // ── Template-related checks ─────────────────────────────────────────────
  it('should have a submit button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[type="submit"]');
    expect(button).toBeTruthy();
  });

  it('should disable submit button when form is invalid', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('should enable submit button when form is valid', () => {
    component.form.setValue(validFormData);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
  });

  it('should disable submit button while submitting', fakeAsync(() => {
    component.form.setValue(validFormData);
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult).pipe(delay(1000)));
    component.submit();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    tick(1000);
  }));

  it('should show "Processing..." text while submitting', fakeAsync(() => {
    component.form.setValue(validFormData);
    paymentsServiceSpy.submitPayment.and.returnValue(of(successResult).pipe(delay(1000)));
    component.submit();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.textContent?.trim()).toContain('Processing');
    tick(1000);
  }));

  it('should show "Submit Payment" text when not submitting', () => {
    component.form.setValue(validFormData);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.textContent?.trim()).toContain('Submit Payment');
  });

  it('should display the regulatory notice about BSA/AML', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const notice = compiled.querySelector('.regulatory-notice');
    expect(notice?.textContent).toContain('BSA/AML');
    expect(notice?.textContent).toContain('$10,000');
  });

  it('should render the confirmation host ng-template', () => {
    expect(component.confirmationHost).toBeDefined();
  });

  it('should display error message when account number is invalid and touched', () => {
    const control = component.form.get('recipientAccountNumber')!;
    control.setValue('123');
    control.markAsTouched();
    fixture.detectChanges();
    const errorEl = fixture.nativeElement.querySelector('.gb-error');
    expect(errorEl?.textContent).toContain('8');
  });
});
