import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ListingsService } from '../listings/listings.service';
import { DamageClaimsService } from '../damage-claims/damage-claims.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { DecideListingDto } from './dto/decide-listing.dto';
import { ResolveClaimDto } from './dto/resolve-claim.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private admin: AdminService,
    private listings: ListingsService,
    private claims: DamageClaimsService,
  ) {}

  @Get('analytics')
  analytics() {
    return this.admin.analytics();
  }

  @Patch('settings/commission')
  updateCommission(@Body() dto: UpdateCommissionDto) {
    return this.admin.updateCommission(dto.percent);
  }

  @Get('listings/pending')
  pendingListings() {
    return this.listings.findPendingReview();
  }

  @Patch('listings/:id/decision')
  decideListing(@Param('id') id: string, @Body() dto: DecideListingDto) {
    return this.listings.reviewDecision(id, dto.approve, dto.reason);
  }

  @Get('claims')
  openClaims() {
    return this.claims.findOpen();
  }

  @Patch('claims/:id/resolve')
  resolveClaim(@Req() req: any, @Param('id') id: string, @Body() dto: ResolveClaimDto) {
    return this.claims.resolve(id, dto.approvedAmount, req.user.userId);
  }
}
