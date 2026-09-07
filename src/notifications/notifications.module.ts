import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ConsoleNotificationProvider } from './console-notification.provider';

@Module({
  providers: [NotificationsService, ConsoleNotificationProvider],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
