import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Place {
  id: string;
  name: string;
  description?: string;
  category: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION';
  address: string;
  location?: {
    lat: number;
    lon: number;
  };
  latitude?: number;
  longitude?: number;
  priceMin?: number;
  priceMax?: number;
  priceRange?: string | null;
  avgRating: number;
  ratingAverage?: number;
  amenities: string[];
  images?: string[];
  isVerified?: boolean;
  status: string;
  avatarUrl?: string;
  distance?: number; // Calculated on coordinates distance search
  isTravelersChoice?: boolean;
  travelerPhotos?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly searchBase = 'http://localhost:3000/search';

  autocomplete(query: string, category?: string): Observable<Place[]> {
    const params: any = { q: query };
    if (category) {
      params.category = category;
    }
    return this.http.get<Place[]>(`${this.searchBase}/autocomplete`, { params });
  }

  searchPlaces(filters: {
    lat?: number;
    lon?: number;
    radius?: number;
    nelat?: number;
    nelon?: number;
    swlat?: number;
    swlon?: number;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    amenities?: string[];
    category?: string;
    status?: string;
  }): Observable<Place[]> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'amenities' && Array.isArray(value)) {
          value.forEach((val) => {
            params = params.append('amenities', val);
          });
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<Place[]>(`${this.searchBase}/places`, { params });
  }

  getRecentHistory(): Observable<string[]> {
    return this.http.get<string[]>(`${this.searchBase}/history`);
  }

  addHistory(term: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.searchBase}/history`, { term });
  }

  clearHistory(): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.searchBase}/history`);
  }
}
