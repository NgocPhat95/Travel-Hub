import { Component, ElementRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SearchService, Place } from '../../../core/services/search.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent implements OnInit {
  private readonly searchService = inject(SearchService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly eRef = inject(ElementRef);

  searchControl = new FormControl('');
  suggestions = signal<Place[]>([]);
  recentSearches = signal<string[]>([]);
  showDropdown = signal(false);
  isLoading = signal(false);

  isAuthenticated = this.authService.isAuthenticated;

  ngOnInit() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const query = value?.trim();
          if (!query) {
            this.suggestions.set([]);
            return of([]);
          }
          this.isLoading.set(true);
          return this.searchService.autocomplete(query);
        }),
      )
      .subscribe({
        next: (data) => {
          this.suggestions.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });

    // Load history initially if logged in
    if (this.isAuthenticated()) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.searchService.getRecentHistory().subscribe({
      next: (history) => this.recentSearches.set(history),
    });
  }

  onFocus() {
    this.showDropdown.set(true);
    if (this.isAuthenticated() && !this.searchControl.value?.trim()) {
      this.loadHistory();
    }
  }

  selectPlace(place: Place) {
    this.searchControl.setValue(place.name, { emitEvent: false });
    this.showDropdown.set(false);

    // Save history if logged in
    if (this.isAuthenticated()) {
      this.searchService.addHistory(place.name).subscribe(() => this.loadHistory());
    }

    const lat = place.location?.lat ?? place.latitude;
    const lon = place.location?.lon ?? place.longitude;

    // Go to Map page centered at place location
    this.router.navigate(['/map-search'], {
      queryParams: {
        lat,
        lon,
        name: place.name,
      },
    });
  }

  selectHistory(term: string) {
    this.searchControl.setValue(term);
    this.showDropdown.set(false);
    this.router.navigate(['/map-search'], {
      queryParams: { q: term },
    });
  }

  onSearchSubmit() {
    const query = this.searchControl.value?.trim();
    if (!query) {
      return;
    }

    this.showDropdown.set(false);
    if (this.isAuthenticated()) {
      this.searchService.addHistory(query).subscribe(() => this.loadHistory());
    }

    this.router.navigate(['/map-search'], {
      queryParams: { q: query },
    });
  }

  clearHistory(event: Event) {
    event.stopPropagation();
    this.searchService.clearHistory().subscribe({
      next: () => this.recentSearches.set([]),
    });
  }

  highlightMatch(text: string): string {
    const query = this.searchControl.value?.trim();
    if (!query) {
      return text;
    }

    const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<span class="text-cyan-500 font-extrabold">$1</span>');
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showDropdown.set(false);
    }
  }
}
