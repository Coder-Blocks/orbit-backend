import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookings.create(req.user.userId, dto);
  }

  @Get()
  findMine(@Req() req: any) {
    return this.bookings.findMine(req.user.userId);
  }

  @Get('owner/requests')
  findForOwner(@Req() req: any) {
    return this.bookings.findForOwnerUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookings.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookings.updateStatus(id, dto.status, req.user.userId);
  }

  // Demo shortcuts for the payment-confirmed -> pickup-scheduled and
  // active-rental -> return-scheduled hops - see the comment on
  // PICKUP_PREP_CHAIN / RETURN_PREP_CHAIN in bookings.service.ts.
  @Post(':id/advance-to-pickup-ready')
  advanceToPickupReady(@Req() req: any, @Param('id') id: string) {
    return this.bookings.advanceToPickupReady(id, req.user.userId);
  }

  @Post(':id/confirm-pickup')
  confirmPickup(@Req() req: any, @Param('id') id: string) {
    return this.bookings.confirmPickup(id, req.user.userId);
  }

  @Post(':id/advance-to-return-ready')
  advanceToReturnReady(@Req() req: any, @Param('id') id: string) {
    return this.bookings.advanceToReturnReady(id, req.user.userId);
  }

  @Post(':id/confirm-return')
  confirmReturn(@Req() req: any, @Param('id') id: string) {
    return this.bookings.confirmReturn(id, req.user.userId);
  }
}
