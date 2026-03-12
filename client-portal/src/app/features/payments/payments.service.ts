import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentRequest {
  recipientAccountNumber: string;
  routingNumber: string;
  amount: number;
  memo: string;
  paymentType: 'domestic' | 'international' | 'ach';
}

export interface PaymentResult {
  success: boolean;
  referenceId: string | null;
  error?: string;
}

export interface PaymentLimit {
  paymentType: string;
  dailyLimit: number;
  perTransactionLimit: number;
  remainingToday: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly baseUrl = '/api/v2/payments';

  constructor(private http: HttpClient) {}

  submitPayment(request: PaymentRequest): Observable<PaymentResult> {
    return this.http.post<PaymentResult>(`${this.baseUrl}/submit`, request);
  }

  getLimits(): Observable<PaymentLimit[]> {
    return this.http.get<PaymentLimit[]>(`${this.baseUrl}/limits`);
  }
}
