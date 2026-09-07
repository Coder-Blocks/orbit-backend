import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePayoutDto } from './dto/create-payout.dto';

@UseGuards(JwtAuthGuard)
@Controller('payouts')
export class PayoutsController {
  constructor(private payouts: PayoutsService) {}

  @Get('owner/:ownerId')
  list(@Param('ownerId') ownerId: string) {
    return this.payouts.listForOwner(ownerId);
  }

  @Post('owner/:ownerId')
  create(@Param('ownerId') ownerId: string, @Body() dto: CreatePayoutDto) {
    return this.payouts.createForOwner(ownerId, dto.amount);
  }
}
