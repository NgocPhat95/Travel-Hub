import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Place } from './search.service';
import { io, Socket } from 'socket.io-client';

export interface TripCollaborator {
  id: string;
  tripId: string;
  userId: string;
  role: 'VIEWER' | 'EDITOR';
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    email: string;
  };
}

export interface TripItem {
  id: string;
  tripId: string;
  placeId: string;
  dayNumber: number;
  sequenceOrder: number;
  note?: string | null;
  place: Place;
}

export interface Trip {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  ownerId: string;
  owner?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  collaborators: TripCollaborator[];
  items: TripItem[];
}

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly tripBase = 'http://localhost:3000/trips';

  createTrip(dto: { title: string; description?: string; startDate: string; endDate: string }): Observable<Trip> {
    return this.http.post<Trip>(this.tripBase, dto);
  }

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.tripBase);
  }

  getTripDetail(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.tripBase}/${id}`);
  }

  deleteTrip(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.tripBase}/${id}`);
  }

  updateTrip(id: string, dto: { title: string; description?: string; startDate: string; endDate: string }): Observable<Trip> {
    return this.http.put<Trip>(`${this.tripBase}/${id}`, dto);
  }

  addTripItem(
    tripId: string,
    dto: { placeId: string; dayNumber: number; sequenceOrder: number; note?: string }
  ): Observable<TripItem> {
    return this.http.post<TripItem>(`${this.tripBase}/${tripId}/items`, dto);
  }

  deleteTripItem(tripId: string, itemId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.tripBase}/${tripId}/items/${itemId}`);
  }

  reorderTripItems(
    tripId: string,
    dto: { items: { id: string; dayNumber: number; sequenceOrder: number }[] }
  ): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.tripBase}/${tripId}/items/reorder`, dto);
  }

  addCollaborator(
    tripId: string,
    dto: { email: string; role: 'VIEWER' | 'EDITOR' }
  ): Observable<TripCollaborator> {
    return this.http.post<TripCollaborator>(`${this.tripBase}/${tripId}/collaborators`, dto);
  }

  removeCollaborator(tripId: string, userId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.tripBase}/${tripId}/collaborators/${userId}`);
  }
}

@Injectable({
  providedIn: 'root',
})
export class TripSocketService {
  private socket: Socket | null = null;
  
  // Real-time notification streams
  itineraryEditing$ = new Subject<{ userName: string; userAvatar?: string }>();
  cardDragging$ = new Subject<{ itemId: string; userId: string; userName: string; userAvatar?: string }>();
  cardDropped$ = new Subject<{ itemId: string; userId: string }>();
  itineraryUpdated$ = new Subject<void>();

  connect() {
    if (this.socket) return;
    this.socket = io('http://localhost:3000');

    this.socket.on('itineraryEditing', (data) => {
      this.itineraryEditing$.next(data);
    });

    this.socket.on('cardDragging', (data) => {
      this.cardDragging$.next(data);
    });

    this.socket.on('cardDropped', (data) => {
      this.cardDropped$.next(data);
    });

    this.socket.on('itineraryUpdated', () => {
      this.itineraryUpdated$.next();
    });
  }

  joinTrip(tripId: string, user: { id: string; fullName: string; avatarUrl?: string }) {
    if (!this.socket) this.connect();
    this.socket?.emit('joinTrip', { tripId, user });
  }

  leaveTrip(tripId: string) {
    this.socket?.emit('leaveTrip', { tripId });
  }

  sendEditItinerary(tripId: string, userName: string, userAvatar?: string) {
    this.socket?.emit('editItinerary', { tripId, userName, userAvatar });
  }

  sendDraggingCard(tripId: string, itemId: string, userId: string, userName: string, userAvatar?: string) {
    this.socket?.emit('draggingCard', { tripId, itemId, userId, userName, userAvatar });
  }

  sendDroppedCard(tripId: string, itemId: string, userId: string) {
    this.socket?.emit('droppedCard', { tripId, itemId, userId });
  }

  sendUpdateItinerary(tripId: string) {
    this.socket?.emit('updateItinerary', { tripId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
