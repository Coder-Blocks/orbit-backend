import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

// Mirrors the state diagram in the architecture doc. Every mutation to a
// booking's status should go through assertTransition so an invalid jump
// (e.g. PAYMENT_PENDING -> ACTIVE_RENTAL) is rejected here, not just hidden
// in the UI.
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ['REQUESTED'],
  REQUESTED: ['PENDING_OWNER_APPROVAL'],
  PENDING_OWNER_APPROVAL: ['REJECTED', 'PAYMENT_PENDING'],
  REJECTED: [],
  PAYMENT_PENDING: ['PAYMENT_CONFIRMED', 'CANCELLED'],
  PAYMENT_CONFIRMED: ['CONFIRMED'],
  CONFIRMED: ['PICKUP_SCHEDULED', 'CANCELLED'],
  PICKUP_SCHEDULED: ['PICKUP_INSPECTION_PENDING', 'CANCELLED'],
  PICKUP_INSPECTION_PENDING: ['ACTIVE_RENTAL'],
  ACTIVE_RENTAL: ['RETURN_SCHEDULED', 'CANCELLED'],
  RETURN_SCHEDULED: ['RETURN_INSPECTION_PENDING'],
  RETURN_INSPECTION_PENDING: ['COMPLETED', 'DAMAGE_REVIEW'],
  DAMAGE_REVIEW: ['DEPOSIT_SETTLEMENT', 'DISPUTED'],
  DISPUTED: ['DAMAGE_REVIEW'],
  DEPOSIT_SETTLEMENT: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class BookingStateMachine {
  assertTransition(from: BookingStatus, to: BookingStatus) {
    const allowed = ALLOWED_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(`Cannot move booking from ${from} to ${to}`);
    }
  }

  allowedFrom(status: BookingStatus): BookingStatus[] {
    return ALLOWED_TRANSITIONS[status] || [];
  }
}
