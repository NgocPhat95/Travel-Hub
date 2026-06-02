import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BusinessService, B2BPlace, MonthAnalytics } from '../../../core/services/business.service';
import { PlaceService } from '../../../core/services/place.service';
import { Place } from '../../../core/services/search.service';
import { AnalyticsComponent } from '../analytics/analytics.component';

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AnalyticsComponent],
  templateUrl: './business-dashboard.component.html',
  styleUrl: './business-dashboard.component.scss',
})
export class BusinessDashboardComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly placeService = inject(PlaceService);
  private readonly fb = inject(FormBuilder);

  ownedPlaces = signal<B2BPlace[]>([]);
  unclaimedPlaces = signal<Place[]>([]);
  selectedPlace = signal<B2BPlace | null>(null);
  analyticsData = signal<MonthAnalytics[]>([]);

  isLoading = signal(true);
  isSubmittingClaim = signal(false);
  claimSuccess = signal('');
  claimError = signal('');

  // Drag and drop claim file upload
  selectedFile: File | null = null;
  dragOver = false;

  claimForm = this.fb.group({
    placeId: ['', Validators.required],
  });

  // Review responses map: reviewId -> response text
  responseTexts: { [reviewId: string]: string } = {};
  isSavingResponse: { [reviewId: string]: boolean } = {};

  ngOnInit() {
    this.loadOwnedPlaces();
  }

  loadOwnedPlaces() {
    this.isLoading.set(true);
    this.businessService.getOwnedPlaces().subscribe({
      next: (places) => {
        this.ownedPlaces.set(places);
        if (places.length > 0) {
          this.selectPlace(places[0]);
        } else {
          this.selectedPlace.set(null);
          this.loadUnclaimedPlaces();
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadUnclaimedPlaces() {
    // Fetch places to populate claim dropdown
    this.placeService.getPlaces({ limit: 100 }).subscribe({
      next: (res) => {
        const ownedIds = new Set(this.ownedPlaces().map((p) => p.id));
        this.unclaimedPlaces.set(res.places.filter((p) => !ownedIds.has(p.id)));
      },
    });
  }

  selectPlace(place: B2BPlace) {
    this.selectedPlace.set(place);
    this.loadAnalytics(place.id);

    // Populate existing responses
    place.reviews.forEach((review) => {
      this.responseTexts[review.id] = review.businessResponse?.content || '';
    });
  }

  loadAnalytics(placeId: string) {
    this.businessService.getAnalytics(placeId).subscribe({
      next: (data) => {
        this.analyticsData.set(data);
      },
    });
  }

  // File drag & drop
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
    }
  }

  submitClaim() {
    if (this.claimForm.invalid || !this.selectedFile) {
      this.claimError.set('Vui lòng chọn địa điểm và kéo thả tải lên hồ sơ giấy phép.');
      return;
    }

    this.isSubmittingClaim.set(true);
    this.claimSuccess.set('');
    this.claimError.set('');

    const placeId = this.claimForm.value.placeId!;

    this.businessService.claimListing(placeId, this.selectedFile).subscribe({
      next: () => {
        this.isSubmittingClaim.set(false);
        this.claimSuccess.set('Kích hoạt quyền sở hữu địa điểm thành công! Hệ thống đã tự động phê duyệt để kiểm thử.');
        this.selectedFile = null;
        this.claimForm.reset();
        this.loadOwnedPlaces();
      },
      error: (err) => {
        this.isSubmittingClaim.set(false);
        this.claimError.set(err?.error?.message || 'Có lỗi xảy ra khi yêu cầu sở hữu.');
      },
    });
  }

  submitResponse(reviewId: string) {
    const content = this.responseTexts[reviewId]?.trim();
    if (!content) return;

    this.isSavingResponse[reviewId] = true;
    this.businessService.respondToReview(reviewId, content).subscribe({
      next: (res) => {
        this.isSavingResponse[reviewId] = false;
        if (this.selectedPlace()) {
          this.selectedPlace.update((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              reviews: prev.reviews.map((r) => {
                if (r.id === reviewId) {
                  return { ...r, businessResponse: res };
                }
                return r;
              }),
            };
          });
        }
      },
      error: () => {
        this.isSavingResponse[reviewId] = false;
      },
    });
  }
}
