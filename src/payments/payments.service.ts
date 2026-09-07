import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MockPaymentProvider } from './mock-payment.provider';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private provider: MockPaymentProvider,
  ) {}

  async createOrderForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
    const order = await this.provider.createOrder(Number(booking.totalPayable), 'INR', {
      bookingId,
    });
    await this.prisma.payment.create({
      data: { bookingId, provider: 'mock', status: 'INITIATED', amount: booking.totalPayable },
    });
    return order;
  }

  async handleWebhook(payload: unknown, signature: string) {
    if (!this.provider.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }
    // Look up the payment by provider reference and update its status here
    // once a real provider (with real webhook payload shapes) is wired in.
    return { received: true };
  }
}
