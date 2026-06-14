import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface Participant {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  email: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  user: Participant;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  messages?: Message[];
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiBase = 'http://localhost:3000/chat';
  
  private socket: Socket | null = null;
  newMessage$ = new Subject<Message>();

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiBase}/conversations`);
  }

  startConversation(recipientId: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiBase}/conversations`, { recipientId });
  }

  getMessages(conversationId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiBase}/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: string, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiBase}/conversations/${conversationId}/messages`, { content });
  }

  // Socket Connections
  connect(userId: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.socket) return;

    this.socket = io('http://localhost:3000');

    this.socket.on('connect', () => {
      console.log('Chat Socket: Connected. Registering user room...');
      this.socket?.emit('registerUser', { userId });
    });

    this.socket.on('newMessage', (msg: Message) => {
      console.log('Chat Socket: Received new message:', msg);
      this.newMessage$.next(msg);
    });

    this.socket.on('disconnect', () => {
      console.log('Chat Socket: Disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Chat Socket: Manually disconnected');
    }
  }
}
