import { Component, ElementRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SearchService, Place } from '../../core/services/search.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly searchService = inject(SearchService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly eRef = inject(ElementRef);
  private readonly route = inject(ActivatedRoute);

  searchControl = new FormControl('');
  selectedTab = signal<'ALL' | 'ATTRACTION' | 'HOTEL' | 'RESTAURANT'>('ALL');
  
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
          const categoryFilter = this.selectedTab() === 'ALL' ? undefined : this.selectedTab();
          return this.searchService.autocomplete(query, categoryFilter);
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

    // Listen for tab query parameter changes (from Navbar clicks)
    this.route.queryParams.subscribe(params => {
      const tabParam = params['tab'];
      if (tabParam === 'ALL' || tabParam === 'ATTRACTION' || tabParam === 'HOTEL' || tabParam === 'RESTAURANT') {
        this.selectedTab.set(tabParam);
      }
    });

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

  selectTab(tab: 'ALL' | 'ATTRACTION' | 'HOTEL' | 'RESTAURANT') {
    this.selectedTab.set(tab);
    // Trigger re-fetch suggestions if query exists
    const query = this.searchControl.value?.trim();
    if (query) {
      this.isLoading.set(true);
      const categoryFilter = tab === 'ALL' ? undefined : tab;
      this.searchService.autocomplete(query, categoryFilter).subscribe({
        next: (data) => {
          this.suggestions.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    }
  }

  getPlaceholderText(): string {
    switch (this.selectedTab()) {
      case 'ATTRACTION':
        return 'Địa điểm giải trí, tham quan, hoạt động vui chơi...';
      case 'HOTEL':
        return 'Tên khách sạn, khu nghỉ dưỡng, homestay...';
      case 'RESTAURANT':
        return 'Tên nhà hàng, quán ăn, quán cà phê...';
      default:
        return 'Địa điểm tham quan, hoạt động giải trí, khách sạn, nhà hàng...';
    }
  }

  selectPlace(place: Place) {
    this.searchControl.setValue(place.name, { emitEvent: false });
    this.showDropdown.set(false);

    if (this.isAuthenticated()) {
      this.searchService.addHistory(place.name).subscribe(() => this.loadHistory());
    }

    // Direct detail redirect
    this.router.navigate(['/place', place.id]);
  }

  selectHistory(term: string) {
    this.searchControl.setValue(term);
    this.showDropdown.set(false);
    
    const category = this.selectedTab() === 'ALL' ? undefined : this.selectedTab();
    this.router.navigate(['/places'], {
      queryParams: { 
        q: term,
        ...(category && { category })
      },
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

    const category = this.selectedTab() === 'ALL' ? undefined : this.selectedTab();
    this.router.navigate(['/places'], {
      queryParams: { 
        q: query,
        ...(category && { category })
      },
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

  // Helper method for home features click
  navigateToInterest(type: string) {
    switch (type) {
      case 'outdoor':
        this.router.navigate(['/places'], { queryParams: { category: 'ATTRACTION', q: 'outdoor' } });
        break;
      case 'food':
        this.router.navigate(['/places'], { queryParams: { category: 'RESTAURANT' } });
        break;
      case 'culture':
        this.router.navigate(['/places'], { queryParams: { category: 'ATTRACTION', q: 'văn hóa' } });
        break;
      case 'water':
        this.router.navigate(['/places'], { queryParams: { category: 'ATTRACTION', q: 'nước' } });
        break;
    }
  }
}
