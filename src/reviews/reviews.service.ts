import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  create(itemId: string, bookingId: string, authorId: string, rating: number, body?: string) {
    return this.prisma.review.create({ data: { itemId, bookingId, authorId, rating, body } });
  }

  forItem(itemId: string) {
    return this.prisma.review.findMany({ where: { itemId }, orderBy: { createdAt: 'desc' } });
  }
}
