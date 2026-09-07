import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryItemsDto } from './dto/query-items.dto';
import { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async search(query: QueryItemsDto) {
    const where: Record<string, unknown> = { status: 'LIVE' };
    if (query.city) where.city = { name: query.city };
    if (query.category) where.category = { slug: query.category };

    return this.prisma.item.findMany({
      where,
      include: { pricing: true, media: true, city: true, category: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        pricing: true,
        media: true,
        specs: true,
        city: true,
        category: true,
        owner: true,
      },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  // Every listing belongs to an OwnerProfile, not a User directly - a user
  // becomes an owner implicitly the first time they list something, which
  // is why this creates one on demand rather than requiring a separate
  // "become an owner" step (matches the "same account can be both a renter
  // and an owner" decision in the architecture doc).
  async findMine(userId: string) {
    const ownerProfile = await this.prisma.ownerProfile.findUnique({ where: { userId } });
    if (!ownerProfile) return [];
    return this.prisma.item.findMany({
      where: { ownerId: ownerProfile.id },
      include: { pricing: true, category: true, city: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateItemDto) {
    let ownerProfile = await this.prisma.ownerProfile.findUnique({ where: { userId } });
    if (!ownerProfile) {
      ownerProfile = await this.prisma.ownerProfile.create({ data: { userId } });
    }
    return this.prisma.item.create({
      data: {
        ownerId: ownerProfile.id,
        categoryId: dto.categoryId,
        cityId: dto.cityId,
        title: dto.title,
        status: 'IN_REVIEW',
        pricing: {
          create: [{ unit: 'DAY', amount: dto.dayPrice, depositAmount: dto.deposit }],
        },
      },
      include: { pricing: true, category: true, city: true },
    });
  }

  async addMedia(itemId: string, userId: string, url: string, angle?: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');
    const ownerProfile = await this.prisma.ownerProfile.findUnique({ where: { userId } });
    if (!ownerProfile || item.ownerId !== ownerProfile.id) {
      throw new ForbiddenException('Only the owner of this listing can add photos to it');
    }
    return this.prisma.itemMedia.create({
      data: { itemId, url, type: 'image', angle },
    });
  }

  // --- Admin moderation ---

  findPendingReview() {
    return this.prisma.item.findMany({
      where: { status: 'IN_REVIEW' },
      include: { pricing: true, category: true, city: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  reviewDecision(id: string, approve: boolean, reason?: string) {
    return this.prisma.item.update({
      where: { id },
      data: approve
        ? { status: 'LIVE', rejectionReason: null }
        : { status: 'REJECTED', rejectionReason: reason || 'Rejected by admin' },
    });
  }
}
