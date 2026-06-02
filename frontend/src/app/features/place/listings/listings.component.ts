import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlaceService } from '../../../core/services/place.service';
import { Place } from '../../../core/services/search.service';

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listings.component.html',
  styleUrl: './listings.component.scss',
})
export class ListingsComponent implements OnInit {
  private readonly placeService = inject(PlaceService);

  places = signal<Place[]>([]);
  total = signal(0);
  isLoading = signal(true);
  errorMessage = signal('');

  // Pagination & Filters
  limit = 6;
  offset = signal(0);
  category = signal<string>('');
  sortBy = signal<string>('rating');

  ngOnInit() {
    this.fetchListings();
  }

  fetchListings() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.placeService
      .getPlaces({
        limit: this.limit,
        offset: this.offset(),
        category: this.category() || undefined,
        sortBy: this.sortBy(),
      })
      .subscribe({
        next: (res) => {
          this.places.set(res.places);
          this.total.set(res.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Không thể tải danh sách địa điểm.');
        },
      });
  }

  setCategory(cat: string) {
    this.category.set(cat);
    this.offset.set(0);
    this.fetchListings();
  }

  setSortBy(sort: string) {
    this.sortBy.set(sort);
    this.offset.set(0);
    this.fetchListings();
  }

  nextPage() {
    if (this.offset() + this.limit < this.total()) {
      this.offset.update((prev) => prev + this.limit);
      this.fetchListings();
    }
  }

  prevPage() {
    if (this.offset() > 0) {
      this.offset.update((prev) => Math.max(0, prev - this.limit));
      this.fetchListings();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.total() / this.limit) || 1;
  }

  get currentPage(): number {
    return Math.floor(this.offset() / this.limit) + 1;
  }
}
