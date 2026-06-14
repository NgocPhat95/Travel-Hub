import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Place } from './search.service';

export interface PartnerPrice {
  id: string;
  partnerName: 'AGODA' | 'BOOKING_COM' | 'EXPEDIA';
  price: number;
  currency: string;
  deepLink: string;
  isBestDeal: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  placeId: string;
  checkIn: string;
  checkOut?: string | null;
  guestsCount: number;
  totalPrice?: number | null;
  specialRequests?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  place?: Place;
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly bookingBase = 'http://localhost:3000/booking';

  getPrices(placeId: string): Observable<PartnerPrice[]> {
    return this.http.get<PartnerPrice[]>(`${this.bookingBase}/places/${placeId}/prices`);
  }

  getRedirectUrl(placeId: string, partnerName: string, userId?: string): string {
    const baseUrl = `${this.bookingBase}/redirect`;
    const params = new URLSearchParams({
      placeId,
      partnerName,
    });
    if (userId) {
      params.append('userId', userId);
    }
    return `${baseUrl}?${params.toString()}`;
  }

  createReservation(dto: {
    placeId: string;
    checkIn: string;
    checkOut?: string;
    guestsCount: number;
    totalPrice?: number;
    specialRequests?: string;
  }): Observable<Booking> {
    return this.http.post<Booking>(`${this.bookingBase}/reserve`, dto);
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.bookingBase}/my`);
  }

  cancelBooking(id: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.bookingBase}/${id}/cancel`, {});
  }
}

