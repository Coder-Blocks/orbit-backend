import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConsoleNotificationProvider } from './console-notification.provider';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private provider: ConsoleNotificationProvider,
  ) {}

  async notify(userId: string, type: string, payload: Record<string, unknown>) {
    await this.prisma.notification.create({ data: { userId, type, payload: payload as never } });
    await this.provider.send(userId, type, payload);
  }

  listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
