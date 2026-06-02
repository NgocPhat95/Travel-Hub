import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
})
export class TripGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinTrip')
  handleJoinTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; user: { id: string; fullName: string; avatarUrl?: string } },
  ) {
    const room = `trip_${data.tripId}`;
    client.join(room);
    console.log(`Socket client ${client.id} joined room: ${room}`);
  }

  @SubscribeMessage('leaveTrip')
  handleLeaveTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    const room = `trip_${data.tripId}`;
    client.leave(room);
    console.log(`Socket client ${client.id} left room: ${room}`);
  }

  @SubscribeMessage('editItinerary')
  handleEditItinerary(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; userName: string; userAvatar?: string },
  ) {
    const room = `trip_${data.tripId}`;
    client.to(room).emit('itineraryEditing', {
      userName: data.userName,
      userAvatar: data.userAvatar,
    });
  }

  @SubscribeMessage('draggingCard')
  handleDraggingCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; itemId: string; userId: string; userName: string; userAvatar?: string },
  ) {
    const room = `trip_${data.tripId}`;
    client.to(room).emit('cardDragging', {
      itemId: data.itemId,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
    });
  }

  @SubscribeMessage('droppedCard')
  handleDroppedCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; itemId: string; userId: string },
  ) {
    const room = `trip_${data.tripId}`;
    client.to(room).emit('cardDropped', {
      itemId: data.itemId,
      userId: data.userId,
    });
  }

  @SubscribeMessage('updateItinerary')
  handleUpdateItinerary(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    const room = `trip_${data.tripId}`;
    client.to(room).emit('itineraryUpdated');
  }
}
