import { Component, ElementRef, HostListener, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
export class HomeComponent implements OnInit, OnDestroy {
  private readonly searchService = inject(SearchService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly eRef = inject(ElementRef);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  searchControl = new FormControl('');
  selectedTab = signal<'ALL' | 'ATTRACTION' | 'HOTEL' | 'RESTAURANT'>('ALL');
  
  suggestions = signal<Place[]>([]);
  recentSearches = signal<string[]>([]);
  showDropdown = signal(false);
  isLoading = signal(false);

  isAuthenticated = this.authService.isAuthenticated;

  travelersChoicePlaces = signal<any[]>([]);

  // Banner slide settings
  currentSlideIndex = signal(0);
  progress = signal(0);
  private progressInterval: any;
  private readonly SLIDE_DURATION = 6000; // 6 seconds

  bannerSlides = [
    {
      image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1000&q=85',
      title: 'Khám phá Cổng Torii Cổ Kính tại Kyoto, Nhật Bản',
      subtitle: 'Hơn 10.000 cổng Torii sơn son rực rỡ uốn lượn qua những ngọn núi linh thiêng của cố đô Kyoto.',
      tagline: 'Vẻ đẹp văn hóa & tâm linh',
      gradient: 'from-rose-950 via-slate-900 to-indigo-950 border-rose-500/20',
      buttonColor: 'bg-rose-400 text-slate-950 hover:bg-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
      glowColor: 'bg-rose-500/20',
      interest: 'culture'
    },
    {
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=85',
      title: 'Hùng vĩ Vịnh Hạ Long, Kỳ quan thiên nhiên thế giới',
      subtitle: 'Du thuyền cao cấp len lỏi qua hàng ngàn đảo đá vôi nhấp nhô tuyệt đẹp giữa làn nước xanh lục bảo.',
      tagline: 'Kỳ quan thiên nhiên thế giới',
      gradient: 'from-emerald-950 via-slate-900 to-cyan-950 border-emerald-500/20',
      buttonColor: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]',
      glowColor: 'bg-emerald-500/20',
      interest: 'outdoor'
    },
    {
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=85',
      title: 'Lãng mạn Tháp Eiffel, Paris, Pháp',
      subtitle: 'Thưởng thức ẩm thực Pháp bên dòng sông Seine thơ mộng và ngắm tháp Eiffel lấp lánh ánh đèn.',
      tagline: 'Kinh đô ánh sáng',
      gradient: 'from-indigo-950 via-slate-900 to-slate-950 border-indigo-500/20',
      buttonColor: 'bg-blue-400 text-slate-950 hover:bg-blue-300 shadow-[0_0_15px_rgba(96,165,250,0.3)]',
      glowColor: 'bg-blue-500/20',
      interest: 'food'
    },
    {
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=85',
      title: 'Bali Thiên Đường Biển Đảo, Indonesia',
      subtitle: 'Hòa mình vào thiên nhiên hoang sơ, bãi cát vàng lấp lánh và các ngôi đền cổ kính bên đại dương.',
      tagline: 'Thiên đường nhiệt đới',
      gradient: 'from-cyan-950 via-slate-900 to-indigo-950 border-cyan-500/20',
      buttonColor: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]',
      glowColor: 'bg-cyan-500/20',
      interest: 'water'
    },
    {
      image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1000&q=85',
      title: 'Cổ kính Đấu trường La Mã Colosseum, Ý',
      subtitle: 'Ngược dòng lịch sử khám phá biểu tượng kiến trúc vĩ đại của đế chế La Mã cổ đại.',
      tagline: 'Di sản lịch sử nhân loại',
      gradient: 'from-amber-950 via-slate-900 to-stone-950 border-orange-500/20',
      buttonColor: 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]',
      glowColor: 'bg-orange-500/20',
      interest: 'culture'
    }
  ];

  featuredGuides = signal<any[]>([
    {
      slug: 'top-10-nha-hang-ven-song-sai-gon',
      title: 'Top 10 nhà hàng ven sông Sài Gòn không thể bỏ lỡ năm 2026',
      excerpt: 'Từ The Deck Saigon đến những quán cóc bình dân với tầm nhìn sông thơ mộng...',
      category: 'FOOD',
      coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      readTime: 7,
      date: '08/06/2026',
      author: { name: 'Minh Châu', avatar: 'https://i.pravatar.cc/40?img=5' }
    },
    {
      slug: 'kham-pha-vinh-ha-long-toan-tap',
      title: 'Cẩm nang khám phá Vịnh Hạ Long từ A đến Z — Tour, Thời điểm & Kinh nghiệm',
      excerpt: 'Hạ Long là kỳ quan thiên nhiên thế giới với hơn 1.600 hòn đảo đá vôi...',
      category: 'ATTRACTION',
      coverImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
      readTime: 12,
      date: '06/06/2026',
      author: { name: 'Thanh Tùng', avatar: 'https://i.pravatar.cc/40?img=3' }
    },
    {
      slug: '5-khach-san-sang-trong-da-nang',
      title: '5 khách sạn nghỉ dưỡng sang trọng nhất Đà Nẵng: Đánh giá thực tế từ du khách',
      excerpt: 'Đà Nẵng có dải khách sạn ven biển đẳng cấp thế giới...',
      category: 'HOTEL',
      coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      readTime: 9,
      date: '04/06/2026',
      author: { name: 'Linh Nguyễn', avatar: 'https://i.pravatar.cc/40?img=9' }
    }
  ]);

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

    // Load Travelers Choice places (limit 3)
    this.http.get<any[]>('http://localhost:3000/places/travelers-choice?category=ALL').subscribe({
      next: (data) => {
        this.travelersChoicePlaces.set(data.slice(0, 3));
      },
      error: (e) => console.error('Failed to load Travelers Choice on home page', e)
    });
    if (typeof window !== 'undefined') {
      this.startProgressTimer();
    }
  }

  ngOnDestroy() {
    this.stopProgressTimer();
  }

  startProgressTimer() {
    if (typeof window === 'undefined') {
      return;
    }
    this.stopProgressTimer();
    this.progress.set(0);
    const step = 60; // update every 60ms
    const increment = (step / this.SLIDE_DURATION) * 100;

    this.progressInterval = setInterval(() => {
      const currentProgress = this.progress() + increment;
      if (currentProgress >= 100) {
        this.nextSlide();
      } else {
        this.progress.set(currentProgress);
      }
    }, step);
  }

  stopProgressTimer() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  nextSlide() {
    const nextIndex = (this.currentSlideIndex() + 1) % this.bannerSlides.length;
    this.currentSlideIndex.set(nextIndex);
    this.progress.set(0);
    this.startProgressTimer();
  }

  prevSlide() {
    const prevIndex = (this.currentSlideIndex() - 1 + this.bannerSlides.length) % this.bannerSlides.length;
    this.currentSlideIndex.set(prevIndex);
    this.progress.set(0);
    this.startProgressTimer();
  }

  setSlide(index: number) {
    this.currentSlideIndex.set(index);
    this.progress.set(0);
    this.startProgressTimer();
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
    this.router.navigate(['/travelers-choice'], {
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
    this.router.navigate(['/travelers-choice'], {
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
        this.router.navigate(['/travelers-choice'], { queryParams: { category: 'ATTRACTION', q: 'outdoor' } });
        break;
      case 'food':
        this.router.navigate(['/travelers-choice'], { queryParams: { category: 'RESTAURANT' } });
        break;
      case 'culture':
        this.router.navigate(['/travelers-choice'], { queryParams: { category: 'ATTRACTION', q: 'văn hóa' } });
        break;
      case 'water':
        this.router.navigate(['/travelers-choice'], { queryParams: { category: 'ATTRACTION', q: 'nước' } });
        break;
    }
  }

  formatPrice(price: number | null): string {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  getCategoryLabel(cat: string): string {
    const map: Record<string, string> = {
      HOTEL: 'Khách sạn',
      RESTAURANT: 'Nhà hàng',
      ATTRACTION: 'Điểm tham quan',
      FOOD: 'Ẩm thực',
      TIPS: 'Mẹo du lịch',
    };
    return map[cat] || cat;
  }

  getCategoryIcon(cat: string): string {
    const map: Record<string, string> = { HOTEL: '🏨', RESTAURANT: '🍽️', ATTRACTION: '🗺️', FOOD: '🍜', TIPS: '💡' };
    return map[cat] || '📍';
  }

  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }
}
