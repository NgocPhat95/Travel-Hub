import { Component, ElementRef, HostListener, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthModalComponent } from './features/auth/auth-modal/auth-modal.component';
import { AuthService } from './core/services/auth.service';
import { SearchService, Place } from './core/services/search.service';
import { AiConciergeComponent } from './features/ai-assistant/ai-concierge/ai-concierge.component';
import { WriteReviewModalComponent } from './features/review/write-review-modal/write-review-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, AuthModalComponent, CommonModule, ReactiveFormsModule, AiConciergeComponent, WriteReviewModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly eRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  
  title = 'frontend';
  showAuthModal = false;
  showNavbarSearch = signal(false);
  isHomePage = signal(false);
  showProfileDropdown = signal(false);
  showExploreDropdown = signal(false);


  searchControl = new FormControl('');
  suggestions = signal<Place[]>([]);
  showDropdown = signal(false);
  isLoading = signal(false);

  // Quick Review variables
  showQuickReviewSearchModal = signal(false);
  showWriteReviewModal = signal(false);
  selectedPlaceForReview = signal<Place | null>(null);
  reviewSearchControl = new FormControl('');
  reviewSuggestions = signal<Place[]>([]);
  isLoadingReviewSearch = signal(false);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;

  ngOnInit() {
    // Check initial route
    this.checkRoute(this.router.url);

    // Subscribe to navigation events to show/hide search
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.urlAfterRedirects || event.url);
      this.showDropdown.set(false);
      this.searchControl.setValue('', { emitEvent: false });
    });

    // Handle search autocomplete
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const query = value?.trim();
        if (!query) {
          this.suggestions.set([]);
          return of([]);
        }
        this.isLoading.set(true);
        return this.searchService.autocomplete(query);
      })
    ).subscribe({
      next: (data) => {
        this.suggestions.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });

    // Handle review search autocomplete
    this.reviewSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const query = value?.trim();
        if (!query) {
          this.reviewSuggestions.set([]);
          return of([]);
        }
        this.isLoadingReviewSearch.set(true);
        return this.searchService.autocomplete(query);
      })
    ).subscribe({
      next: (data) => {
        this.reviewSuggestions.set(data);
        this.isLoadingReviewSearch.set(false);
      },
      error: () => {
        this.isLoadingReviewSearch.set(false);
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkRoute(this.router.url);
    }
  }

  private checkRoute(url: string) {
    const isHome = url === '/' || url.startsWith('/?');
    this.isHomePage.set(isHome);

    if (isHome) {
      if (isPlatformBrowser(this.platformId)) {
        // Only show navbar search after scrolling down past the hero search section
        const scrollOffset = window.scrollY || document.documentElement.scrollTop;
        this.showNavbarSearch.set(scrollOffset > 240);
      } else {
        this.showNavbarSearch.set(false);
      }
    } else {
      this.showNavbarSearch.set(true);
    }
  }

  onFocus() {
    this.showDropdown.set(true);
  }

  selectPlace(place: Place) {
    this.searchControl.setValue(place.name, { emitEvent: false });
    this.showDropdown.set(false);
    this.router.navigate(['/place', place.id]);
  }

  onSearchSubmit() {
    const query = this.searchControl.value?.trim();
    if (!query) return;
    this.showDropdown.set(false);
    this.router.navigate(['/travelers-choice'], { queryParams: { q: query } });
  }

  highlightMatch(text: string): string {
    const query = this.searchControl.value?.trim();
    if (!query) return text;
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
      this.showProfileDropdown.set(false);
    }
  }

  toggleProfileDropdown(event: Event) {
    event.stopPropagation();
    this.showProfileDropdown.update(v => !v);
  }

  selectNavbarTab(category: string) {
    this.router.navigate(['/travelers-choice'], { queryParams: { category } });
  }

  openQuickReviewSearch() {
    if (!this.isAuthenticated()) {
      this.showAuthModal = true;
      return;
    }
    this.reviewSearchControl.setValue('', { emitEvent: false });
    this.reviewSuggestions.set([]);
    this.showQuickReviewSearchModal.set(true);
  }

  selectPlaceForReview(place: Place) {
    this.selectedPlaceForReview.set(place);
    this.showQuickReviewSearchModal.set(false);
    this.showWriteReviewModal.set(true);
  }

  onReviewSubmitted() {
    console.log('Review submitted successfully via Navbar Quick Link!');
    const currentUrl = this.router.url;
    if (currentUrl.includes(`/place/${this.selectedPlaceForReview()?.id}`)) {
      if (isPlatformBrowser(this.platformId)) {
        window.location.reload();
      }
    }
  }

  logout() {
    this.authService.logout();
  }
}

