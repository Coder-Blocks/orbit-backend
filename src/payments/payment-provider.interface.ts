export interface ProviderOrder {
  orderId: string;
  amount: number;
  currency: string;
}

export interface PaymentResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  providerRef: string;
}

export interface RefundResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  refundRef: string;
}

export interface PayoutResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  payoutRef: string;
}

// The app only ever talks to this interface, never a gateway SDK directly -
// see the "Payment & Commission Architecture" section of the architecture
// doc for why (escrow/split-settlement capability depends entirely on the
// gateway you onboard with).
export interface PaymentProvider {
  createOrder(
    amount: number,
    currency: string,
    metadata: Record<string, unknown>,
  ): Promise<ProviderOrder>;
  verifyWebhookSignature(payload: unknown, signature: string): boolean;
  capturePayment(orderId: string): Promise<PaymentResult>;
  initiateRefund(paymentId: string, amount: number, reason: string): Promise<RefundResult>;
  createPayout(ownerId: string, amount: number): Promise<PayoutResult>;
}
