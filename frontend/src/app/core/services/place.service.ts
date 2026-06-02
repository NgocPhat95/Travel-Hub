import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Place } from './search.service';

export interface Question {
  id: string;
  placeId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  answers: Answer[];
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PlaceService {
  private readonly http = inject(HttpClient);
  private readonly placesBase = 'http://localhost:3000/places';

  getPlaces(filters: {
    limit?: number;
    offset?: number;
    category?: string;
    sortBy?: string;
  }): Observable<{ places: Place[]; total: number; limit: number; offset: number }> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<{ places: Place[]; total: number; limit: number; offset: number }>(
      this.placesBase,
      { params }
    );
  }

  getPlaceDetail(id: string): Observable<{ place: Place; seo: { title: string; metaDescription: string; jsonLdSchema: any } }> {
    return this.http.get<{ place: Place; seo: { title: string; metaDescription: string; jsonLdSchema: any } }>(
      `${this.placesBase}/${id}`
    );
  }

  getPlaceQuestions(placeId: string): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.placesBase}/${placeId}/questions`);
  }

  createQuestion(placeId: string, content: string): Observable<Question> {
    return this.http.post<Question>(`${this.placesBase}/${placeId}/questions`, { content });
  }

  createAnswer(questionId: string, content: string): Observable<Answer> {
    return this.http.post<Answer>(`${this.placesBase}/questions/${questionId}/answers`, { content });
  }

  suggestEdit(placeId: string, proposedData: any): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.placesBase}/${placeId}/suggest-edit`, {
      proposedData,
    });
  }
}
