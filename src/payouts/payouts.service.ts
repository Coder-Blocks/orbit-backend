import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  createForOwner(ownerId: string, amount: number) {
    return this.prisma.payout.create({
      data: { ownerId, amount, status: 'PROCESSING', cycleDate: new Date() },
    });
  }

  listForOwner(ownerId: string) {
    return this.prisma.payout.findMany({ where: { ownerId }, orderBy: { cycleDate: 'desc' } });
  }
}
