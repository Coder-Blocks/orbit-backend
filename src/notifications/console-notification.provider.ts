import { Injectable } from '@nestjs/common';
import { NotificationProvider } from './notification-provider.interface';

// Swap this for real email/SMS/push adapters per the notification events
// matrix in the architecture doc. In-app notifications are written to the
// database by NotificationsService regardless of which channel this sends
// through.
@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  async send(userId: string, type: string, payload: Record<string, unknown>) {
    // eslint-disable-next-line no-console
    console.log(`[notify] ${userId} <- ${type}`, payload);
  }
}
