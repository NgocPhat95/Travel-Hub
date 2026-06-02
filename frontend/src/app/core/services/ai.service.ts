import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export interface ItineraryActivity {
  placeName: string;
  category: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION';
  time: string;
  note: string;
  placeId?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  activities: ItineraryActivity[];
}

export interface ItineraryResult {
  tripId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  days: ItineraryDay[];
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly aiBase = 'http://localhost:3000/ai';

  chat(message: string, chatHistory: ChatMessage[]): Observable<string> {
    return this.http.post<string>(`${this.aiBase}/chat`, { message, chatHistory }, { responseType: 'text' as any });
  }

  generateItinerary(params: {
    destination: string;
    days: number;
    budget: string;
    companions: string;
  }): Observable<ItineraryResult> {
    return this.http.post<ItineraryResult>(`${this.aiBase}/itinerary`, params);
  }
}
