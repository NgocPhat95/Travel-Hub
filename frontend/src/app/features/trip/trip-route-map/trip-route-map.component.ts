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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
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
}
