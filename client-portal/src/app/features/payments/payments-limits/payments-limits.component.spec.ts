import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { PaymentsLimitsComponent } from './payments-limits.component';
import { PaymentsService, PaymentLimit } from '../payments.service';

describe('PaymentsLimitsComponent', () => {
  let component: PaymentsLimitsComponent;
  let fixture: ComponentFixture<PaymentsLimitsComponent>;
  let paymentsServiceSpy: jasmine.SpyObj<PaymentsService>;

  const mockLimits: PaymentLimit[] = [
    { paymentType: 'Domestic Wire', dailyLimit: 100000, perTransactionLimit: 50000, remainingToday: 75000 },
    { paymentType: 'ACH',           dailyLimit: 25000,  perTransactionLimit: 10000, remainingToday: 25000 },
  ];

  beforeEach(async () => {
    paymentsServiceSpy = jasmine.createSpyObj('PaymentsService', ['getLimits']);
    paymentsServiceSpy.getLimits.and.returnValue(of(mockLimits));

    await TestBed.configureTestingModule({
      imports: [PaymentsLimitsComponent],
      providers: [
        { provide: PaymentsService, useValue: paymentsServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentsLimitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load and display payment limits', () => {
    expect(component.limits.length).toBe(2);
    expect(component.limits[0].paymentType).toBe('Domestic Wire');
  });
});
