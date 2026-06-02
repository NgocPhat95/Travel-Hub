import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService, AdminPlace, EditSuggestion, AdminStats } from '../../../core/services/admin.service';
import { ContentModerationComponent } from '../content-moderation/content-moderation.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ContentModerationComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  activeTab = signal<'overview' | 'places' | 'suggestions' | 'moderation'>('overview');

  // Dashboard Stats signals
  usersCount = signal(0);
  placesCount = signal(0);
  reviewsCount = signal(0);
  claimsCount = signal(0);
  revenueCount = signal(0);

  isLoadingStats = signal(true);
  isLoadingPlaces = signal(true);
  isLoadingSuggestions = signal(true);

  places = signal<AdminPlace[]>([]);
  suggestions = signal<EditSuggestion[]>([]);

  // CRUD Place Modal state
  showFormModal = signal(false);
  isEditing = signal(false);
  selectedPlaceId: string | null = null;
  formError = signal('');
  formSuccess = signal('');
  isSubmittingForm = signal(false);

  placeForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    category: ['ATTRACTION', Validators.required],
    address: ['', Validators.required],
    latitude: [21.0285, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [105.8521, [Validators.required, Validators.min(-180), Validators.max(180)]],
    priceMin: [null as number | null],
    priceMax: [null as number | null],
    priceRange: [''],
    amenities: [''], // Will handle as comma-separated string in UI
    avatarUrl: [''],
  });

  ngOnInit() {
    this.loadStats();
    this.loadPlaces();
    this.loadSuggestions();
  }

  loadStats() {
    this.isLoadingStats.set(true);
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.animateStats(stats);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false),
    });
  }

  loadPlaces() {
    this.isLoadingPlaces.set(true);
    this.adminService.getPlaces().subscribe({
      next: (p) => {
        this.places.set(p);
        this.isLoadingPlaces.set(false);
      },
      error: () => this.isLoadingPlaces.set(false),
    });
  }

  loadSuggestions() {
    this.isLoadingSuggestions.set(true);
    this.adminService.getEditSuggestions().subscribe({
      next: (s) => {
        this.suggestions.set(s);
        this.isLoadingSuggestions.set(false);
      },
      error: () => this.isLoadingSuggestions.set(false),
    });
  }

  animateStats(stats: AdminStats) {
    const duration = 1200; // ms
    this.animateValue(0, stats.totalUsers, duration, (val) => this.usersCount.set(val));
    this.animateValue(0, stats.totalPlaces, duration, (val) => this.placesCount.set(val));
    this.animateValue(0, stats.totalReviews, duration, (val) => this.reviewsCount.set(val));
    this.animateValue(0, stats.pendingClaims, duration, (val) => this.claimsCount.set(val));
    this.animateValue(0, stats.estimatedRevenue, duration, (val) => this.revenueCount.set(val));
  }

  private animateValue(start: number, end: number, duration: number, callback: (v: number) => void) {
    if (end === 0) {
      callback(0);
      return;
    }
    const range = end - start;
    let current = start;
    const startTime = new Date().getTime();
    
    const timer = setInterval(() => {
      const timePassed = new Date().getTime() - startTime;
      const progress = Math.min(timePassed / duration, 1);
      
      // Easing out quadratic
      const easeOutQuad = progress * (2 - progress);
      current = Math.floor(start + range * easeOutQuad);
      
      callback(current);
      
      if (progress === 1) {
        clearInterval(timer);
      }
    }, 16);
  }

  // Tab switching
  setTab(tab: 'overview' | 'places' | 'suggestions' | 'moderation') {
    this.activeTab.set(tab);
    if (tab === 'overview') {
      this.loadStats();
    } else if (tab === 'places') {
      this.loadPlaces();
    } else if (tab === 'suggestions') {
      this.loadSuggestions();
    }
  }

  // CRUD Place
  openCreateModal() {
    this.isEditing.set(false);
    this.selectedPlaceId = null;
    this.placeForm.reset({
      category: 'ATTRACTION',
      latitude: 21.0285,
      longitude: 105.8521,
    });
    this.formError.set('');
    this.formSuccess.set('');
    this.showFormModal.set(true);
  }

  openEditModal(place: AdminPlace) {
    this.isEditing.set(true);
    this.selectedPlaceId = place.id;
    this.placeForm.patchValue({
      name: place.name,
      description: place.description || '',
      category: place.category,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      priceMin: place.priceMin || null,
      priceMax: place.priceMax || null,
      priceRange: place.priceRange || '',
      amenities: place.amenities.join(', '),
      avatarUrl: place.avatarUrl || '',
    });
    this.formError.set('');
    this.formSuccess.set('');
    this.showFormModal.set(true);
  }

  closeModal() {
    this.showFormModal.set(false);
    this.placeForm.reset();
  }

  submitPlaceForm() {
    if (this.placeForm.invalid) {
      this.formError.set('Vui lòng kiểm tra lại thông tin biểu mẫu.');
      return;
    }

    this.isSubmittingForm.set(true);
    this.formError.set('');
    this.formSuccess.set('');

    const formValues = this.placeForm.value;
    const amenitiesArray = formValues.amenities
      ? formValues.amenities.split(',').map((a) => a.trim()).filter((a) => a.length > 0)
      : [];

    const payload: Partial<AdminPlace> = {
      name: formValues.name!,
      description: formValues.description || '',
      category: formValues.category!,
      address: formValues.address!,
      latitude: Number(formValues.latitude),
      longitude: Number(formValues.longitude),
      priceMin: formValues.priceMin !== null ? Number(formValues.priceMin) : null,
      priceMax: formValues.priceMax !== null ? Number(formValues.priceMax) : null,
      priceRange: formValues.priceRange || null,
      amenities: amenitiesArray,
      avatarUrl: formValues.avatarUrl || null,
    };

    if (this.isEditing() && this.selectedPlaceId) {
      this.adminService.updatePlace(this.selectedPlaceId, payload).subscribe({
        next: () => {
          this.isSubmittingForm.set(false);
          this.formSuccess.set('Cập nhật địa điểm du lịch thành công!');
          setTimeout(() => {
            this.closeModal();
            this.loadPlaces();
          }, 1000);
        },
        error: (err) => {
          this.isSubmittingForm.set(false);
          this.formError.set(err?.error?.message || 'Có lỗi xảy ra khi cập nhật.');
        },
      });
    } else {
      this.adminService.createPlace(payload).subscribe({
        next: () => {
          this.isSubmittingForm.set(false);
          this.formSuccess.set('Tạo địa điểm du lịch thành công!');
          setTimeout(() => {
            this.closeModal();
            this.loadPlaces();
          }, 1000);
        },
        error: (err) => {
          this.isSubmittingForm.set(false);
          this.formError.set(err?.error?.message || 'Có lỗi xảy ra khi tạo mới.');
        },
      });
    }
  }

  deletePlace(placeId: string) {
    if (!confirm('Bạn có chắc chắn muốn XÓA địa điểm này vĩnh viễn khỏi hệ thống?')) {
      return;
    }

    this.adminService.deletePlace(placeId).subscribe({
      next: () => {
        this.places.update((prev) => prev.filter((p) => p.id !== placeId));
      },
    });
  }

  // Edit Suggestions
  approveSuggestion(id: string) {
    this.adminService.approveEditSuggestion(id).subscribe({
      next: () => {
        // Change status in list
        this.suggestions.update((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: 'APPROVED' } : s))
        );
      },
    });
  }

  rejectSuggestion(id: string) {
    this.adminService.rejectEditSuggestion(id).subscribe({
      next: () => {
        this.suggestions.update((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: 'REJECTED' } : s))
        );
      },
    });
  }

  getProposedFields(proposedData: any) {
    return Object.entries(proposedData).map(([key, value]) => {
      // Human readable names
      let label = key;
      if (key === 'name') label = 'Tên';
      else if (key === 'description') label = 'Mô tả';
      else if (key === 'address') label = 'Địa chỉ';
      else if (key === 'latitude') label = 'Vĩ độ';
      else if (key === 'longitude') label = 'Kinh độ';
      else if (key === 'priceRange') label = 'Khoảng giá';
      else if (key === 'amenities') label = 'Tiện ích';

      let displayVal = value;
      if (Array.isArray(value)) {
        displayVal = value.join(', ');
      }

      return { label, val: displayVal };
    });
  }
}
