import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations/:conversationId/messages')
export class MessagingController {
  constructor(private messaging: MessagingService) {}

  @Get()
  list(@Param('conversationId') conversationId: string) {
    return this.messaging.listMessages(conversationId);
  }

  @Post()
  send(@Param('conversationId') conversationId: string, @Body() dto: SendMessageDto) {
    return this.messaging.sendMessage(conversationId, dto.senderId, dto.body);
  }
}
