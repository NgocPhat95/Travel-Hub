import { Component, OnInit, AfterViewInit, inject, signal, PLATFORM_ID, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService, Place } from '../../../core/services/search.service';
import { SearchComponent } from '../search/search.component';

@Component({
  selector: 'app-map-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SearchComponent],
  templateUrl: './map-search.component.html',
  styleUrl: './map-search.component.scss',
})
export class MapSearchComponent implements OnInit, AfterViewInit {
  private readonly searchService = inject(SearchService);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  places = signal<Place[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  // Filters State
  category = signal<string>('');
  priceMin = signal<number | null>(null);
  priceMax = signal<number | null>(null);
  rating = signal<number>(0);
  selectedAmenities = signal<string[]>([]);
  
  availableAmenities = [
    { value: 'wifi', label: 'Wifi miễn phí' },
    { value: 'parking', label: 'Đỗ xe' },
    { value: 'pool', label: 'Bể bơi' },
    { value: 'restaurant', label: 'Nhà hàng' },
    { value: 'spa', label: 'Spa' },
    { value: 'gym', label: 'Phòng Gym' },
  ];

  // Leaflet map objects
  private map: any = null;
  private markersLayer: any = null;
  private L: any = null;

  // Map Bounds / Center
  private currentBounds = {
    nelat: undefined as number | undefined,
    nelon: undefined as number | undefined,
    swlat: undefined as number | undefined,
    swlon: undefined as number | undefined,
  };

  private centerLat = 21.0285; // Default Hanoi
  private centerLon = 105.8521;
  private zoomLevel = 13;

  ngOnInit() {
    // Listen to query params for centering map or general text search
    this.route.queryParams.subscribe((params) => {
      if (params['lat'] && params['lon']) {
        this.centerLat = parseFloat(params['lat']);
        this.centerLon = parseFloat(params['lon']);
        this.zoomLevel = 15;
        
        if (this.map && isPlatformBrowser(this.platformId)) {
          this.map.setView([this.centerLat, this.centerLon], this.zoomLevel);
          this.updateSearchFromBounds();
        }
      } else if (params['q']) {
        // If query string q is passed, search initially
        this.searchService.autocomplete(params['q']).subscribe((data) => {
          if (data.length > 0) {
            const first = data[0];
            this.centerLat = first.location?.lat ?? first.latitude ?? 21.0285;
            this.centerLon = first.location?.lon ?? first.longitude ?? 105.8521;
            this.zoomLevel = 14;
            if (this.map && isPlatformBrowser(this.platformId)) {
              this.map.setView([this.centerLat, this.centerLon], this.zoomLevel);
              this.updateSearchFromBounds();
            }
          }
        });
      }
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
    }
  }

  private async initMap() {
    // Dynamic import to prevent SSR server crash
    this.L = await import('leaflet');

    // Create Map
    this.map = this.L.map('map', { zoomControl: false }).setView(
      [this.centerLat, this.centerLon],
      this.zoomLevel
    );

    // Zoom buttons in bottom right
    this.L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Map tiles layer (OpenStreetMap Standard tile set)
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // Markers layer
    this.markersLayer = this.L.layerGroup().addTo(this.map);

    // Map drag/zoom end listener to automatically fetch places inside view bounding box
    this.map.on('moveend', () => {
      this.updateSearchFromBounds();
    });

    // Initial load
    this.updateSearchFromBounds();
  }

  private updateSearchFromBounds() {
    if (!this.map) {
      return;
    }
    const bounds = this.map.getBounds();
    const NorthEast = bounds.getNorthEast();
    const SouthWest = bounds.getSouthWest();

    this.currentBounds = {
      nelat: NorthEast.lat,
      nelon: NorthEast.lng,
      swlat: SouthWest.lat,
      swlon: SouthWest.lng,
    };

    this.fetchPlaces();
  }

  fetchPlaces() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const queryParams = {
      nelat: this.currentBounds.nelat,
      nelon: this.currentBounds.nelon,
      swlat: this.currentBounds.swlat,
      swlon: this.currentBounds.swlon,
      category: this.category() || undefined,
      priceMin: this.priceMin() !== null ? this.priceMin()! : undefined,
      priceMax: this.priceMax() !== null ? this.priceMax()! : undefined,
      rating: this.rating() || undefined,
      amenities: this.selectedAmenities().length > 0 ? this.selectedAmenities() : undefined,
    };

    this.searchService.searchPlaces(queryParams).subscribe({
      next: (data) => {
        this.places.set(data);
        this.isLoading.set(false);
        this.renderMarkers(data);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải các địa điểm du lịch.');
      },
    });
  }

  private renderMarkers(places: Place[]) {
    if (!this.markersLayer || !this.L) {
      return;
    }
    
    // Clear old markers
    this.markersLayer.clearLayers();

    places.forEach((place) => {
      // Create glowing Neon marker
      const isHotel = place.category === 'HOTEL';
      const markerClass = isHotel ? 'neon-marker-indigo' : 'neon-marker-cyan';
      
      const customIcon = this.L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div class="${markerClass} animate-fade-in"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const popupHtml = `
        <div class="p-2 font-sans w-52">
          <img src="${place.avatarUrl || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80'}" class="w-full h-24 object-cover rounded-lg mb-2" />
          <h4 class="font-black text-slate-800 text-sm mb-1">${place.name}</h4>
          <p class="text-xs text-slate-500 truncate mb-1">${place.address}</p>
          <div class="flex justify-between items-center text-xs font-bold mt-2">
            <span class="text-cyan-600">★ ${place.avgRating}</span>
            <span class="text-slate-700">${isHotel ? 'Khách sạn' : place.category === 'RESTAURANT' ? 'Nhà hàng' : 'Điểm đến'}</span>
          </div>
        </div>
      `;

      const lat = place.location?.lat ?? place.latitude;
      const lon = place.location?.lon ?? place.longitude;
      if (lat === undefined || lon === undefined) return;

      const marker = this.L.marker([lat, lon], { icon: customIcon })
        .bindPopup(popupHtml, { closeButton: false });

      this.markersLayer.addLayer(marker);
    });
  }

  // Filter actions
  setCategory(cat: string) {
    this.category.set(cat);
    this.fetchPlaces();
  }

  toggleAmenity(amenity: string) {
    const current = this.selectedAmenities();
    if (current.includes(amenity)) {
      this.selectedAmenities.set(current.filter((a) => a !== amenity));
    } else {
      this.selectedAmenities.set([...current, amenity]);
    }
    this.fetchPlaces();
  }

  resetFilters() {
    this.category.set('');
    this.priceMin.set(null);
    this.priceMax.set(null);
    this.rating.set(0);
    this.selectedAmenities.set([]);
    this.fetchPlaces();
  }

  focusOnPlace(place: Place) {
    const lat = place.location?.lat ?? place.latitude;
    const lon = place.location?.lon ?? place.longitude;
    if (lat === undefined || lon === undefined) return;
    if (this.map) {
      this.map.setView([lat, lon], 15);
      this.updateSearchFromBounds();
    }
  }

  formatPrice(val?: number): string {
    if (val === undefined || val === null || val === 0) {
      return 'Miễn phí';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }
}
