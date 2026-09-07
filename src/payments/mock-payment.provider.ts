import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  PaymentProvider,
  ProviderOrder,
  PaymentResult,
  RefundResult,
  PayoutResult,
} from './payment-provider.interface';

// Stand-in implementation so the app boots and the booking flow can be
// exercised end-to-end without a real gateway wired up yet. Replace with a
// real adapter (Razorpay, Cashfree, etc.) once you've onboarded a
// UPI-compatible payment aggregator - nothing outside this file should need
// to change.
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async createOrder(amount: number, currency: string): Promise<ProviderOrder> {
    return { orderId: 'mock_order_' + randomUUID(), amount, currency };
  }

  verifyWebhookSignature(): boolean {
    return true;
  }

  async capturePayment(orderId: string): Promise<PaymentResult> {
    return { status: 'SUCCESS', providerRef: orderId };
  }

  async initiateRefund(): Promise<RefundResult> {
    return { status: 'SUCCESS', refundRef: 'mock_refund_' + randomUUID() };
  }

  async createPayout(): Promise<PayoutResult> {
    return { status: 'SUCCESS', payoutRef: 'mock_payout_' + randomUUID() };
  }
}
