import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { PostComment } from './social.service';

export interface PostLikeEvent {
  postId: string;
  userId: string;
  isLike: boolean;
  likeCount: number;
}

export interface PostCommentEvent {
  postId: string;
  comment: PostComment;
}

@Injectable({
  providedIn: 'root',
})
export class SocialSocketService {
  private socket: Socket | null = null;
  private readonly platformId = inject(PLATFORM_ID);

  postLiked$ = new Subject<PostLikeEvent>();
  postCommented$ = new Subject<PostCommentEvent>();

  connect() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.socket) return;
    this.socket = io('http://localhost:3000');

    this.socket.on('postLiked', (data: PostLikeEvent) => {
      this.postLiked$.next(data);
    });

    this.socket.on('postCommented', (data: PostCommentEvent) => {
      this.postCommented$.next(data);
    });

    console.log('Social Socket: Connected to WebSocket Server');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Social Socket: Disconnected from WebSocket Server');
    }
  }
}
