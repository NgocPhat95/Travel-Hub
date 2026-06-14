import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';

export interface TravelersChoicePlace {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  avgRating: number;
  ratingAverage: number;
  images: string[];
  amenities: string[];
  priceMin: number | null;
  priceMax: number | null;
  priceRange: string | null;
  rank: number;
  reviewCount: number;
  isTravelersChoice: boolean;
  isBestOfBest: boolean;
  bookingPrice: number | null;
  bookingLink: string | null;
}

@Component({
  selector: 'app-travelers-choice',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './travelers-choice.component.html',
  styleUrl: './travelers-choice.component.scss',
})
export class TravelersChoiceComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  places = signal<TravelersChoicePlace[]>([]);
  isLoading = signal(true);
  activeCategory = signal<'ALL' | 'HOTEL' | 'RESTAURANT' | 'ATTRACTION'>('ALL');
  searchQuery = signal<string>('');

  filteredPlaces = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.places();
    if (!q) return list;
    return list.filter(place => 
      place.name.toLowerCase().includes(q) || 
      (place.description && place.description.toLowerCase().includes(q)) ||
      place.address.toLowerCase().includes(q)
    );
  });

  showRedirectModal = signal(false);
  redirectingTo = signal('');
  currentUser = this.authService.user;

  readonly categories = [
    { key: 'ALL', label: 'Tất cả', icon: '🌟' },
    { key: 'HOTEL', label: 'Khách sạn', icon: '🏨' },
    { key: 'RESTAURANT', label: 'Nhà hàng', icon: '🍽️' },
    { key: 'ATTRACTION', label: 'Điểm tham quan', icon: '🗺️' },
  ] as const;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const cat = params['category'] || 'ALL';
      if (['ALL', 'HOTEL', 'RESTAURANT', 'ATTRACTION'].includes(cat.toUpperCase())) {
        this.activeCategory.set(cat.toUpperCase() as any);
      }
      this.searchQuery.set(params['q'] || '');
      this.loadPlaces();
    });
  }

  loadPlaces() {
    this.isLoading.set(true);
    const cat = this.activeCategory();
    const params = cat !== 'ALL' ? `?category=${cat}` : '';
    this.http.get<TravelersChoicePlace[]>(`http://localhost:3000/places/travelers-choice${params}`).subscribe({
      next: (data) => {
        this.places.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  selectCategory(cat: 'ALL' | 'HOTEL' | 'RESTAURANT' | 'ATTRACTION') {
    this.activeCategory.set(cat);
    this.loadPlaces();
  }

  bookNow(place: TravelersChoicePlace) {
    const userId = this.currentUser()?.id;
    const url = this.bookingService.getRedirectUrl(place.id, 'BOOKING_COM', userId);
    this.redirectingTo.set(place.name);
    this.showRedirectModal.set(true);
    setTimeout(() => {
      window.open(url, '_blank');
      this.showRedirectModal.set(false);
    }, 1500);
  }

  formatPrice(price: number | null): string {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  getCategoryLabel(cat: string): string {
    const map: Record<string, string> = {
      HOTEL: 'Khách sạn',
      RESTAURANT: 'Nhà hàng',
      ATTRACTION: 'Điểm tham quan',
    };
    return map[cat] || cat;
  }

  getCategoryIcon(cat: string): string {
    const map: Record<string, string> = { HOTEL: '🏨', RESTAURANT: '🍽️', ATTRACTION: '🗺️' };
    return map[cat] || '📍';
  }

  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }
}
