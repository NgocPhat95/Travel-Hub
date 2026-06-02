import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PartnerPrice {
  id: string;
  partnerName: 'AGODA' | 'BOOKING_COM' | 'EXPEDIA';
  price: number;
  currency: string;
  deepLink: string;
  isBestDeal: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:3000/booking';

  getPrices(placeId: string): Observable<PartnerPrice[]> {
    return this.http.get<PartnerPrice[]>(`${this.apiBase}/places/${placeId}/prices`);
  }

  getRedirectUrl(placeId: string, partnerName: string, userId?: string): string {
    const baseUrl = `${this.apiBase}/redirect`;
    const params = new URLSearchParams({
      placeId,
      partnerName,
    });
    if (userId) {
      params.append('userId', userId);
    }
    return `${baseUrl}?${params.toString()}`;
  }
}
