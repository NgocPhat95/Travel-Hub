import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async getOrCreateConversation(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new ForbiddenException('Cannot start a conversation with yourself.');
    }

    // Check if recipient exists
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });
    if (!recipient) {
      throw new NotFoundException('Recipient user not found.');
    }

    // Find conversation where both userId and recipientId are participants
    const conversations = await this.prisma.conversation.findMany({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (conversations.length > 0) {
      return conversations[0];
    }

    // Create a new conversation if it does not exist
    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId },
            { userId: recipientId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    // Check if conversation exists and user is a participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: senderId },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation.');
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update conversation updatedAt timestamp to sort active conversations first
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Notify other participants via WebSocket
    const otherParticipants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        NOT: { userId: senderId },
      },
    });

    for (const p of otherParticipants) {
      this.chatGateway.emitNewMessage(p.userId, message);
    }

    return message;
  }

  async getMessages(conversationId: string, userId: string) {
    // Check if user is a participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation.');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
