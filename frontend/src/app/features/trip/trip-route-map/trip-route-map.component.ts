import { Component, Input, OnChanges, SimpleChanges, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TripItem } from '../../../core/services/trip.service';

@Component({
  selector: 'app-trip-route-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-route-map.component.html',
  styleUrl: './trip-route-map.component.scss',
})
export class TripRouteMapComponent implements OnChanges {
  private readonly platformId = inject(PLATFORM_ID);

  @Input({ required: true }) items: TripItem[] = [];
  @Input({ required: true }) dayNumber!: number;

  private map: any = null;
  private markers: any[] = [];
  private routingControl: any = null;
  private isBrowser = false;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.isBrowser) return;

    if (changes['items']) {
      this.initMapIfNeeded().then(() => {
        this.renderRoute();
      });
    }
  }

  private async initMapIfNeeded() {
    if (this.map) return;

    const L = await import('leaflet');

    this.map = L.map('trip-map', {
      zoomControl: false,
    }).setView([10.776, 106.701], 13);

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; Google Maps',
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Add permanent sovereignty labels for Hoàng Sa and Trường Sa (Vietnam)
    const hoangSaIcon = L.divIcon({
      html: `<div style="text-align: center; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 800; color: #1e293b; background: rgba(255,255,255,0.95); border: 1.5px solid #cbd5e1; padding: 4px 8px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.12); white-space: nowrap; pointer-events: none;">
               🇻🇳 Quần đảo Hoàng Sa <span style="color: #ef4444; font-weight: 900;">(Việt Nam)</span>
             </div>`,
      className: 'sovereignty-label-hoang-sa',
      iconSize: [180, 28],
      iconAnchor: [90, 14],
    });

    const truongSaIcon = L.divIcon({
      html: `<div style="text-align: center; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 800; color: #1e293b; background: rgba(255,255,255,0.95); border: 1.5px solid #cbd5e1; padding: 4px 8px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.12); white-space: nowrap; pointer-events: none;">
               🇻🇳 Quần đảo Trường Sa <span style="color: #ef4444; font-weight: 900;">(Việt Nam)</span>
             </div>`,
      className: 'sovereignty-label-truong-sa',
      iconSize: [180, 28],
      iconAnchor: [90, 14],
    });

    L.marker([16.5, 112.0], { icon: hoangSaIcon, interactive: false }).addTo(this.map);
    L.marker([8.63, 111.9], { icon: truongSaIcon, interactive: false }).addTo(this.map);
  }

  private async renderRoute() {
    if (!this.map) {
      setTimeout(() => this.renderRoute(), 100);
      return;
    }

    const L = await import('leaflet');
    await import('leaflet-routing-machine');

    // Clear old markers
    this.markers.forEach((m) => this.map.removeLayer(m));
    this.markers = [];
    
    // Clear old routing controls
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }

    if (this.items.length === 0) return;

    const latlngs: any[] = [];

    // Add custom index markers
    this.items.forEach((item, idx) => {
      const lat = item.place.latitude ?? item.place.location?.lat;
      const lon = item.place.longitude ?? item.place.location?.lon;
      if (lat === undefined || lon === undefined) return;

      const latlng = L.latLng(lat, lon);
      latlngs.push(latlng);

      const customIcon = L.divIcon({
        html: `<div class="marker-index-bubble">${idx + 1}</div>`,
        className: 'custom-index-marker-icon',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker(latlng, { icon: customIcon })
        .bindPopup(`<b>${idx + 1}. ${item.place.name}</b><br><span style="font-size:10px;color:#888">${item.place.address}</span>`)
        .addTo(this.map);

      this.markers.push(marker);
    });

    // Draw neon glow route lines using Leaflet Routing Machine
    if (latlngs.length >= 2) {
      const Routing = (L as any).Routing;

      this.routingControl = Routing.control({
        waypoints: latlngs,
        routeWhileDragging: false,
        addWaypoints: false,
        createMarker: () => null,
        show: false,
        lineOptions: {
          styles: [
            { color: '#01FCEF', opacity: 0.25, weight: 12 },
            { color: '#6366f1', opacity: 0.55, weight: 6 },
            { color: '#ffffff', opacity: 0.95, weight: 2.5 }
          ],
          addWaypoints: false
        }
      }).addTo(this.map);
      
      const bounds = L.latLngBounds(latlngs);
      this.map.fitBounds(bounds, { padding: [40, 40] });
    } else if (latlngs.length === 1) {
      this.map.setView(latlngs[0], 14);
    }
  }

  focusOnLocation(lat: number, lon: number) {
    if (this.map) {
      this.map.setView([lat, lon], 16, { animate: true, duration: 1 });
      const matchedMarker = this.markers.find((m) => {
        const pos = m.getLatLng();
        return Math.abs(pos.lat - lat) < 0.0001 && Math.abs(pos.lng - lon) < 0.0001;
      });
      if (matchedMarker) {
        matchedMarker.openPopup();
      }
    }
  }
}
