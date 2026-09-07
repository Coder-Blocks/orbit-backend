import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingStateMachine } from './booking-state-machine';

@Module({
  providers: [BookingsService, BookingStateMachine],
  controllers: [BookingsController],
  exports: [BookingsService, BookingStateMachine],
})
export class BookingsModule {}
