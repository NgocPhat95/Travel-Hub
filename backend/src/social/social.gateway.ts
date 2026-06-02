import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
})
export class SocialGateway {
  @WebSocketServer()
  server: Server;

  emitPostLiked(postId: string, userId: string, isLike: boolean, likeCount: number) {
    if (this.server) {
      this.server.emit('postLiked', {
        postId,
        userId,
        isLike,
        likeCount,
      });
      console.log(`WebSocket: Broadcasted postLiked event for post ${postId}`);
    }
  }

  emitPostCommented(postId: string, comment: any) {
    if (this.server) {
      this.server.emit('postCommented', {
        postId,
        comment,
      });
      console.log(`WebSocket: Broadcasted postCommented event for post ${postId}`);
    }
  }
}
