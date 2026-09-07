import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStateMachine } from '../bookings/booking-state-machine';

@Injectable()
export class DamageClaimsService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: BookingStateMachine,
  ) {}

  // Filing a claim is how an owner flags damage instead of confirming a
  // clean return - it moves the booking to DAMAGE_REVIEW rather than letting
  // BookingsService.confirmReturn auto-complete it, and puts the deposit
  // "under review" instead of releasing it.
  async create(bookingId: string, userId: string, description: string, estimatedCost: number) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const ownerProfile = await this.prisma.ownerProfile.findUnique({ where: { userId } });
    if (!ownerProfile || booking.ownerId !== ownerProfile.id) {
      throw new ForbiddenException('Only the owner of this booking can file a damage claim');
    }

    this.stateMachine.assertTransition(booking.status, 'DAMAGE_REVIEW');

    const claim = await this.prisma.damageClaim.create({
      data: { bookingId, description, estimatedCost },
    });

    await this.prisma.deposit.upsert({
      where: { bookingId },
      update: { status: 'UNDER_REVIEW' },
      create: { bookingId, amount: booking.depositAmount, status: 'UNDER_REVIEW' },
    });

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'DAMAGE_REVIEW',
        timeline: {
          create: { fromStatus: booking.status, toStatus: 'DAMAGE_REVIEW', note: 'Owner filed a damage claim' },
        },
      },
    });

    return claim;
  }

  async dispute(claimId: string, userId: string, renterResponse: string) {
    const claim = await this.prisma.damageClaim.findUnique({
      where: { id: claimId },
      include: { booking: true },
    });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.booking.renterId !== userId) {
      throw new ForbiddenException('Only the renter on this booking can respond to the claim');
    }

    await this.prisma.damageClaim.update({ where: { id: claimId }, data: { status: 'DISPUTED' } });

    return this.prisma.dispute.upsert({
      where: { claimId },
      update: { renterResponse },
      create: { claimId, renterResponse },
    });
  }

  findOne(id: string) {
    return this.prisma.damageClaim.findUnique({
      where: { id },
      include: { evidence: true, dispute: true, booking: { include: { item: true, timeline: true } } },
    });
  }

  // --- Admin ---

  findOpen() {
    return this.prisma.damageClaim.findMany({
      where: { status: { in: ['OPEN', 'DISPUTED', 'UNDER_ADMIN_REVIEW'] } },
      include: { booking: { include: { item: true } }, dispute: true },
      orderBy: { id: 'desc' },
    });
  }

  // approvedAmount of 0 rejects the claim outright and releases the full
  // deposit; anything above 0 is deducted (or, if it exceeds the deposit,
  // recorded as an additional charge - see DepositStatus in the schema).
  async resolve(claimId: string, approvedAmount: number, resolvedBy: string) {
    const claim = await this.prisma.damageClaim.findUnique({
      where: { id: claimId },
      include: { booking: true },
    });
    if (!claim) throw new NotFoundException('Claim not found');

    await this.prisma.dispute.upsert({
      where: { claimId },
      update: {
        adminDecision: approvedAmount > 0 ? 'APPROVED' : 'REJECTED',
        approvedAmount,
        resolvedBy,
        resolvedAt: new Date(),
      },
      create: {
        claimId,
        adminDecision: approvedAmount > 0 ? 'APPROVED' : 'REJECTED',
        approvedAmount,
        resolvedBy,
        resolvedAt: new Date(),
      },
    });

    await this.prisma.damageClaim.update({ where: { id: claimId }, data: { status: 'RESOLVED' } });

    const depositStatus =
      approvedAmount <= 0
        ? 'FULL_REFUND'
        : approvedAmount >= Number(claim.booking.depositAmount)
          ? 'ADDITIONAL_CHARGE'
          : 'PARTIAL_REFUND';

    await this.prisma.deposit.update({
      where: { bookingId: claim.bookingId },
      data: { status: depositStatus, approvedDamageAmount: approvedAmount },
    });

    this.stateMachine.assertTransition(claim.booking.status, 'DEPOSIT_SETTLEMENT');
    this.stateMachine.assertTransition('DEPOSIT_SETTLEMENT', 'COMPLETED');
    await this.prisma.booking.update({
      where: { id: claim.bookingId },
      data: {
        status: 'COMPLETED',
        timeline: {
          create: [
            { fromStatus: claim.booking.status, toStatus: 'DEPOSIT_SETTLEMENT', note: 'Admin resolved the damage claim' },
            { fromStatus: 'DEPOSIT_SETTLEMENT', toStatus: 'COMPLETED', note: 'Deposit settled' },
          ],
        },
      },
    });

    return this.findOne(claimId);
  }
}
