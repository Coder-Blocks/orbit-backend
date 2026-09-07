import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  categories() {
    return this.prisma.category.findMany({ include: { subcategories: true } });
  }

  cities() {
    return this.prisma.city.findMany();
  }
}
