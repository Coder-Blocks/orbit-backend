import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async analytics() {
    const [totalUsers, totalListings, totalBookings] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.item.count(),
      this.prisma.booking.count(),
    ]);
    return { totalUsers, totalListings, totalBookings };
  }

  updateCommission(percent: number) {
    return this.prisma.platformCommission.create({
      data: { percent, effectiveFrom: new Date() },
    });
  }
}
