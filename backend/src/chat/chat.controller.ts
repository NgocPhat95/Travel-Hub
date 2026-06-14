import { Controller, UseGuards, Post, Get, Param, Body, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  async openConversation(
    @Request() req: any,
    @Body() body: { recipientId: string },
  ) {
    const userId = req.user.sub;
    return this.chatService.getOrCreateConversation(userId, body.recipientId);
  }

  @Get('conversations')
  async getConversations(@Request() req: any) {
    const userId = req.user.sub;
    return this.chatService.getConversations(userId);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') conversationId: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    const senderId = req.user.sub;
    return this.chatService.sendMessage(conversationId, senderId, body.content);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.chatService.getMessages(conversationId, userId);
  }
}
