import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStateMachine } from './booking-state-machine';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  // Stands in for the real payment-webhook and pickup/return-scheduling
  // steps, which aren't wired to a live gateway yet (see the backend
  // README). Each entry is validated against BookingStateMachine on the way
  // through, so this can't skip a real rule - it just collapses several
  // real-world events into one action so the pickup/return/deposit loop is
  // testable end-to-end before payments are fully wired in.
  private readonly PICKUP_PREP_CHAIN: BookingStatus[] = [
    'PAYMENT_CONFIRMED',
    'CONFIRMED',
    'PICKUP_SCHEDULED',
    'PICKUP_INSPECTION_PENDING',
  ];
  private readonly RETURN_PREP_CHAIN: BookingStatus[] = ['RETURN_SCHEDULED', 'RETURN_INSPECTION_PENDING'];

  constructor(
    private prisma: PrismaService,
    private stateMachine: BookingStateMachine,
  ) {}

  private generateBookingCode(): string {
    return 'ORB-' + randomBytes(4).toString('hex').toUpperCase();
  }

  async create(renterId: string, dto: CreateBookingDto) {
    const item = await this.prisma.item.findUnique({
      where: { id: dto.itemId },
      include: { pricing: true },
    });
    if (!item) throw new NotFoundException('Item not found');

    const dayRate = item.pricing.find((p) => p.unit === 'DAY');
    if (!dayRate) throw new NotFoundException('Item has no daily pricing configured');

    const nights = Math.max(
      1,
      Math.round((new Date(dto.endAt).getTime() - new Date(dto.startAt).getTime()) / 86400000),
    );
    const rentalAmount = Number(dayRate.amount) * nights;
    const commissionPercent = Number(process.env.DEFAULT_COMMISSION_PERCENT || 15);
    const depositAmount = Number(dayRate.depositAmount);

    return this.prisma.booking.create({
      data: {
        itemId: item.id,
        renterId,
        ownerId: item.ownerId,
        status: 'REQUESTED',
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        rentalAmount,
        commissionPercent,
        depositAmount,
        totalPayable: rentalAmount + depositAmount,
        bookingCode: this.generateBookingCode(),
        qrPayload: this.generateBookingCode(),
        timeline: {
          create: { toStatus: 'REQUESTED', note: 'Booking requested by renter' },
        },
      },
    });
  }

  async findMine(renterId: string) {
    return this.prisma.booking.findMany({
      where: { renterId },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Booking.ownerId stores an OwnerProfile id (matching Item.ownerId), not a
  // raw User id - so this resolves the signed-in user's OwnerProfile first,
  // the same on-demand pattern used in ListingsService.
  async findForOwnerUser(userId: string) {
    const ownerProfile = await this.prisma.ownerProfile.findUnique({ where: { userId } });
    if (!ownerProfile) return [];
    return this.prisma.booking.findMany({
      where: { ownerId: ownerProfile.id },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        timeline: true,
        item: true,
        pickupInspection: true,
        returnInspection: true,
        deposit: true,
        damageClaim: { include: { dispute: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateStatus(id: string, to: BookingStatus, actorId?: string, note?: string) {
    const booking = await this.findOne(id);
    this.stateMachine.assertTransition(booking.status, to);
    return this.prisma.booking.update({
      where: { id },
      data: {
        status: to,
        timeline: { create: { fromStatus: booking.status, toStatus: to, actorId, note } },
      },
    });
  }

  // Only the renter on a booking, or the owner of the item it's for, may
  // act on it.
  private async assertParticipant(
    booking: { renterId: string; ownerId: string },
    userId: string,
  ): Promise<void> {
    if (booking.renterId === userId) return;
    const ownerProfile = await this.prisma.ownerProfile.findUnique({ where: { userId } });
    if (ownerProfile && booking.ownerId === ownerProfile.id) return;
    throw new ForbiddenException('You are not part of this booking');
  }

  private async isRenter(booking: { renterId: string }, userId: string): Promise<boolean> {
    return booking.renterId === userId;
  }

  async advanceToPickupReady(id: string, userId: string) {
    const booking = await this.findOne(id);
    await this.assertParticipant(booking, userId);
    let current = booking.status;
    for (const next of this.PICKUP_PREP_CHAIN) {
      this.stateMachine.assertTransition(current, next);
      current = next;
    }
    return this.prisma.booking.update({
      where: { id },
      data: {
        status: current,
        timeline: {
          create: {
            fromStatus: booking.status,
            toStatus: current,
            note: 'Payment confirmed, pickup scheduled (demo shortcut - see README)',
          },
        },
      },
    });
  }

  async confirmPickup(id: string, userId: string) {
    const booking = await this.findOne(id);
    await this.assertParticipant(booking, userId);
    const renter = await this.isRenter(booking, userId);

    await this.prisma.pickupInspection.upsert({
      where: { bookingId: id },
      update: {},
      create: { bookingId: id, checklist: {} },
    });

    const updated = await this.prisma.pickupInspection.update({
      where: { bookingId: id },
      data: renter ? { renterConfirmedAt: new Date() } : { ownerConfirmedAt: new Date() },
    });

    if (updated.ownerConfirmedAt && updated.renterConfirmedAt) {
      this.stateMachine.assertTransition(booking.status, 'ACTIVE_RENTAL');
      await this.prisma.deposit.upsert({
        where: { bookingId: id },
        update: { status: 'HELD' },
        create: { bookingId: id, amount: booking.depositAmount, status: 'HELD' },
      });
      await this.prisma.booking.update({
        where: { id },
        data: {
          status: 'ACTIVE_RENTAL',
          timeline: {
            create: {
              fromStatus: booking.status,
              toStatus: 'ACTIVE_RENTAL',
              note: 'Both parties confirmed pickup condition',
            },
          },
        },
      });
    }

    return updated;
  }

  async advanceToReturnReady(id: string, userId: string) {
    const booking = await this.findOne(id);
    await this.assertParticipant(booking, userId);
    let current = booking.status;
    for (const next of this.RETURN_PREP_CHAIN) {
      this.stateMachine.assertTransition(current, next);
      current = next;
    }
    return this.prisma.booking.update({
      where: { id },
      data: {
        status: current,
        timeline: {
          create: {
            fromStatus: booking.status,
            toStatus: current,
            note: 'Return scheduled (demo shortcut - see README)',
          },
        },
      },
    });
  }

  async confirmReturn(id: string, userId: string) {
    const booking = await this.findOne(id);
    await this.assertParticipant(booking, userId);
    const renter = await this.isRenter(booking, userId);

    await this.prisma.returnInspection.upsert({
      where: { bookingId: id },
      update: {},
      create: { bookingId: id, checklist: {} },
    });

    const updated = await this.prisma.returnInspection.update({
      where: { bookingId: id },
      data: renter ? { renterConfirmedAt: new Date() } : { ownerConfirmedAt: new Date() },
    });

    if (updated.ownerConfirmedAt && updated.renterConfirmedAt) {
      this.stateMachine.assertTransition(booking.status, 'COMPLETED');
      await this.prisma.deposit.update({
        where: { bookingId: id },
        data: { status: 'FULL_REFUND' },
      });
      await this.prisma.booking.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          timeline: {
            create: {
              fromStatus: booking.status,
              toStatus: 'COMPLETED',
              note: 'Both parties confirmed return condition - deposit refunded',
            },
          },
        },
      });
    }

    return updated;
  }
}
