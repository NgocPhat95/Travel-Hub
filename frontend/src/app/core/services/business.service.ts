import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface B2BPlace {
  id: string;
  name: string;
  category: string;
  address: string;
  isVerified: boolean;
  avatarUrl?: string;
  reviews: any[];
}

export interface MonthAnalytics {
  month: string;
  views: number;
  clicks: number;
  reviews: number;
}

@Injectable({
  providedIn: 'root',
})
export class BusinessService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:3000/business';

  claimListing(placeId: string, documentFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('placeId', placeId);
    formData.append('document', documentFile);

    return this.http.post<any>(`${this.apiBase}/claims`, formData);
  }

  getOwnedPlaces(): Observable<B2BPlace[]> {
    return this.http.get<B2BPlace[]>(`${this.apiBase}/places`);
  }

  respondToReview(reviewId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/reviews/${reviewId}/responses`, {
      content,
    });
  }

  getAnalytics(placeId: string): Observable<MonthAnalytics[]> {
    return this.http.get<MonthAnalytics[]>(`${this.apiBase}/places/${placeId}/analytics`);
  }
}
