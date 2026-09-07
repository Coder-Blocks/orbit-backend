import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DamageClaimsService } from './damage-claims.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateClaimDto } from './dto/create-claim.dto';
import { DisputeClaimDto } from './dto/dispute-claim.dto';

@UseGuards(JwtAuthGuard)
@Controller('damage-claims')
export class DamageClaimsController {
  constructor(private claims: DamageClaimsService) {}

  @Post(':bookingId')
  create(@Req() req: any, @Param('bookingId') bookingId: string, @Body() dto: CreateClaimDto) {
    return this.claims.create(bookingId, req.user.userId, dto.description, dto.estimatedCost);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.claims.findOne(id);
  }

  @Post(':id/dispute')
  dispute(@Req() req: any, @Param('id') id: string, @Body() dto: DisputeClaimDto) {
    return this.claims.dispute(id, req.user.userId, dto.renterResponse);
  }
}
