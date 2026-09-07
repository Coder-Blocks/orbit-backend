import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':bookingId/order')
  createOrder(@Param('bookingId') bookingId: string) {
    return this.payments.createOrderForBooking(bookingId);
  }

  // Higher limit than user-facing routes - this is called by the payment
  // gateway itself, not a browser, so legitimate traffic can be bursty.
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('webhook')
  webhook(@Body() body: unknown, @Headers('x-signature') signature: string) {
    return this.payments.handleWebhook(body, signature);
  }
}
