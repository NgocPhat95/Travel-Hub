import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('registerUser')
  handleRegisterUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data && data.userId) {
      client.join(`user_${data.userId}`);
      console.log(`WebSocket: User ${data.userId} joined room user_${data.userId}`);
      client.emit('registered', { status: 'success', userId: data.userId });
    }
  }

  emitNewMessage(recipientId: string, message: any) {
    if (this.server) {
      // Send to the room user_<recipientId>
      this.server.to(`user_${recipientId}`).emit('newMessage', message);
      console.log(`WebSocket: Sent newMessage to room user_${recipientId}`);
    }
  }
}
