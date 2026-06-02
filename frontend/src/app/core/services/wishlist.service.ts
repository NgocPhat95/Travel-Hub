import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Place } from './search.service';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly wishlistBase = 'http://localhost:3000/wishlist';

  addToWishlist(placeId: string): Observable<{ success: boolean; saved: boolean }> {
    return this.http.post<{ success: boolean; saved: boolean }>(`${this.wishlistBase}/${placeId}`, {});
  }

  removeFromWishlist(placeId: string): Observable<{ success: boolean; saved: boolean }> {
    return this.http.delete<{ success: boolean; saved: boolean }>(`${this.wishlistBase}/${placeId}`);
  }

  getWishlist(): Observable<Place[]> {
    return this.http.get<Place[]>(this.wishlistBase);
  }

  getWishlistStatus(placeId: string): Observable<{ saved: boolean }> {
    return this.http.get<{ saved: boolean }>(`${this.wishlistBase}/${placeId}/status`);
  }
}
