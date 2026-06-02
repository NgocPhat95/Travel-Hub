import { Component, Input, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService, Review, ReviewStats } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { WriteReviewModalComponent } from '../write-review-modal/write-review-modal.component';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, WriteReviewModalComponent],
  templateUrl: './review-list.component.html',
  styleUrl: './review-list.component.scss',
})
export class ReviewListComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);
  private readonly authService = inject(AuthService);

  @Input({ required: true }) placeId!: string;

  reviews = signal<Review[]>([]);
  stats = signal<ReviewStats | null>(null);
  totalCount = signal(0);
  
  // Filters and pagination
  limit = 5;
  offset = signal(0);
  selectedRating = signal<number | null>(null);
  
  isLoading = signal(false);
  isLoadingStats = signal(false);
  
  // Modals state
  showWriteModal = signal(false);
  isAuthenticated = this.authService.isAuthenticated;

  // Active Lightbox media
  activeLightboxMedia = signal<string | null>(null);
  activeLightboxType = signal<'IMAGE' | 'VIDEO' | null>(null);

  ngOnInit() {
    this.loadStats();
    this.loadReviews();
  }

  constructor() {
    effect(() => {
      // Re-load reviews when offset or rating filter changes
      this.loadReviews(false);
    }, { allowSignalWrites: true });
  }

  loadStats() {
    this.isLoadingStats.set(true);
    this.reviewService.getReviewStats(this.placeId).subscribe({
      next: (res) => {
        this.stats.set(res);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false)
    });
  }

  loadReviews(append = false) {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    const filterOptions = {
      limit: this.limit,
      offset: this.offset(),
      rating: this.selectedRating() || undefined
    };

    this.reviewService.getReviews(this.placeId, filterOptions).subscribe({
      next: (res) => {
        if (append) {
          this.reviews.update(prev => [...prev, ...res.reviews]);
        } else {
          this.reviews.set(res.reviews);
        }
        this.totalCount.set(res.total);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  filterByRating(star: number) {
    if (this.selectedRating() === star) {
      this.selectedRating.set(null); // toggle off
    } else {
      this.selectedRating.set(star);
    }
    this.offset.set(0); // reset page
  }

  loadMore() {
    this.offset.update(o => o + this.limit);
  }

  onReviewSubmitted() {
    this.offset.set(0);
    this.loadStats();
    this.loadReviews(false);
  }

  toggleLike(review: Review) {
    if (!this.isAuthenticated()) {
      alert('Vui lòng đăng nhập để thích đánh giá này.');
      return;
    }

    if (review.isLiked) {
      this.reviewService.unlikeReview(review.id).subscribe({
        next: (res) => {
          this.reviews.update(list => 
            list.map(r => r.id === review.id ? { ...r, isLiked: false, likesCount: res.likesCount } : r)
          );
        }
      });
    } else {
      this.reviewService.likeReview(review.id).subscribe({
        next: (res) => {
          this.reviews.update(list => 
            list.map(r => r.id === review.id ? { ...r, isLiked: true, likesCount: res.likesCount } : r)
          );
        }
      });
    }
  }

  openLightbox(url: string, type: 'IMAGE' | 'VIDEO') {
    this.activeLightboxMedia.set(url);
    this.activeLightboxType.set(type);
  }

  closeLightbox() {
    this.activeLightboxMedia.set(null);
    this.activeLightboxType.set(null);
  }

  alertNeedLogin() {
    alert('Vui lòng đăng nhập để viết đánh giá.');
  }

  getStarPercentage(star: number): number {
    return this.stats()?.distribution?.[star]?.percentage || 0;
  }

  getCleanlinessPercentage(): number {
    return this.stats() ? (this.stats()!.avgCleanliness / 5) * 100 : 0;
  }

  getServicePercentage(): number {
    return this.stats() ? (this.stats()!.avgService / 5) * 100 : 0;
  }
}
