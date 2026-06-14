import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TripService, Trip } from '../../../core/services/trip.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './trip-list.component.html',
  styleUrl: './trip-list.component.scss'
})
export class TripListComponent implements OnInit {
  private readonly tripService = inject(TripService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  trips = signal<Trip[]>([]);
  isLoading = signal(true);
  activeDropdownTripId = signal<string | null>(null);

  showCreateModal = signal(false);
  showEditModal = signal(false);
  selectedTripForEdit = signal<Trip | null>(null);

  currentUserId = computed(() => this.authService.user()?.id);
  isAuthenticated = computed(() => this.authService.isAuthenticated());

  createForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
  });

  editForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
  });

  ngOnInit() {
    this.loadTrips();
  }

  loadTrips() {
    this.isLoading.set(true);
    this.tripService.getTrips().subscribe({
      next: (res) => {
        this.trips.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeDropdownTripId.set(null);
  }

  toggleTripDropdown(tripId: string, event: Event) {
    event.stopPropagation();
    if (this.activeDropdownTripId() === tripId) {
      this.activeDropdownTripId.set(null);
    } else {
      this.activeDropdownTripId.set(tripId);
    }
  }

  openCreateModal() {
    this.createForm.reset();
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  submitCreateTrip() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const val = this.createForm.value;
    const dto = {
      title: val.title!,
      description: val.description || '',
      startDate: val.startDate!,
      endDate: val.endDate!,
    };

    if (new Date(dto.startDate) > new Date(dto.endDate)) {
      alert('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
      return;
    }

    this.tripService.createTrip(dto).subscribe({
      next: (newTrip) => {
        this.trips.update((prev) => [newTrip, ...prev]);
        this.closeCreateModal();
        // Redirect directly to the planner for this new trip
        this.router.navigate(['/trip', newTrip.id]);
      },
      error: (err) => {
        alert(err?.error?.message || 'Có lỗi xảy ra khi tạo chuyến đi.');
      }
    });
  }

  openEditModal(trip: Trip, event: Event) {
    event.stopPropagation();
    this.activeDropdownTripId.set(null);
    this.selectedTripForEdit.set(trip);

    // Format dates to YYYY-MM-DD for HTML5 date inputs
    const startStr = trip.startDate ? new Date(trip.startDate).toISOString().substring(0, 10) : '';
    const endStr = trip.endDate ? new Date(trip.endDate).toISOString().substring(0, 10) : '';

    this.editForm.setValue({
      title: trip.title,
      description: trip.description || '',
      startDate: startStr,
      endDate: endStr,
    });

    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedTripForEdit.set(null);
  }

  submitEditTrip() {
    const trip = this.selectedTripForEdit();
    if (!trip || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const val = this.editForm.value;
    const dto = {
      title: val.title!,
      description: val.description || '',
      startDate: val.startDate!,
      endDate: val.endDate!,
    };

    if (new Date(dto.startDate) > new Date(dto.endDate)) {
      alert('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
      return;
    }

    this.tripService.updateTrip(trip.id, dto).subscribe({
      next: (updatedTrip) => {
        // Map backend update post properties back correctly
        this.trips.update((prev) =>
          prev.map((t) => (t.id === trip.id ? { ...t, ...updatedTrip } : t))
        );
        this.closeEditModal();
      },
      error: (err) => {
        alert(err?.error?.message || 'Có lỗi xảy ra khi cập nhật chuyến đi.');
      }
    });
  }

  deleteTrip(tripId: string, event: Event) {
    event.stopPropagation();
    this.activeDropdownTripId.set(null);

    if (confirm('Bạn có chắc chắn muốn xóa chuyến đi này không?')) {
      this.tripService.deleteTrip(tripId).subscribe({
        next: () => {
          this.trips.update((prev) => prev.filter((t) => t.id !== tripId));
        },
        error: (err) => {
          alert(err?.error?.message || 'Có lỗi xảy ra khi xóa chuyến đi.');
        }
      });
    }
  }

  getTripDuration(trip: Trip): number {
    if (!trip.startDate || !trip.endDate) return 1;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  getTripLocation(trip: any): string {
    // 1. Try to get location from the first place in the itinerary
    const firstPlace = trip.items?.[0]?.place;
    if (firstPlace) {
      const addr = firstPlace.address || '';
      if (addr.includes('Hà Nội')) return 'Hà Nội';
      if (addr.includes('Hồ Chí Minh') || addr.includes('Sài Gòn')) return 'TP. Hồ Chí Minh';
      if (addr.includes('Đà Lạt')) return 'Đà Lạt';
      if (addr.includes('Nha Trang')) return 'Nha Trang';
      if (addr.includes('Phú Quốc')) return 'Phú Quốc';
      if (addr.includes('Đà Nẵng')) return 'Đà Nẵng';
      if (addr.includes('Hội An')) return 'Hội An';
      return firstPlace.name;
    }

    // 2. Guess from title
    const title = (trip.title || '').toLowerCase();
    if (title.includes('đà lạt')) return 'Đà Lạt';
    if (title.includes('hà nội')) return 'Hà Nội';
    if (title.includes('nha trang')) return 'Nha Trang';
    if (title.includes('vũng tàu')) return 'Vũng Tàu';
    if (title.includes('phú quốc')) return 'Phú Quốc';
    if (title.includes('đà nẵng')) return 'Đà Nẵng';
    if (title.includes('hội an')) return 'Hội An';
    if (title.includes('hồ chí minh') || title.includes('sài gòn') || title.includes('hcm')) return 'TP. Hồ Chí Minh';

    return 'Việt Nam';
  }

  formatTripDate(dateStr: string | Date): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    return `${d.getDate()} thg ${months[d.getMonth()]}, ${d.getFullYear()}`;
  }

  getTripCoverImage(trip: any): string {
    // If the trip has items, extract the first place image
    const firstItem = trip.items?.[0];
    if (firstItem?.place?.images && firstItem.place.images.length > 0) {
      return firstItem.place.images[0];
    }
    // Fallback to high-quality unsplash travel image based on title length/character mapping
    const fallbackImages = [
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'
    ];
    const index = trip.title ? trip.title.length % fallbackImages.length : 0;
    return fallbackImages[index];
  }

  isOwner(trip: Trip): boolean {
    return trip.ownerId === this.currentUserId();
  }
}
