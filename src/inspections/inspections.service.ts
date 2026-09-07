import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  createPickupInspection(bookingId: string, checklist: unknown) {
    return this.prisma.pickupInspection.create({ data: { bookingId, checklist } as never });
  }

  createReturnInspection(bookingId: string, checklist: unknown) {
    return this.prisma.returnInspection.create({ data: { bookingId, checklist } as never });
  }
}
