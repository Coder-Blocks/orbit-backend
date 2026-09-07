import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bookings/:bookingId')
export class InspectionsController {
  constructor(private inspections: InspectionsService) {}

  @Post('pickup-inspection')
  createPickup(@Param('bookingId') bookingId: string, @Body() body: { checklist: unknown }) {
    return this.inspections.createPickupInspection(bookingId, body.checklist);
  }

  @Post('return-inspection')
  createReturn(@Param('bookingId') bookingId: string, @Body() body: { checklist: unknown }) {
    return this.inspections.createReturnInspection(bookingId, body.checklist);
  }
}
