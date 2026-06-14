import { Component, signal, computed, inject, HostListener, PLATFORM_ID, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

type TabType = 'flight' | 'train' | 'bus' | 'tour';

interface Airport { code: string; name: string; city: string; }
interface TrainStation { code: string; name: string; }
interface TourPackage {
  name: string; image: string; location: string;
  duration: string; rating: number; reviewCount: number;
  price: number; originalPrice: number;
  highlights: string[]; bookingLink: string;
}

@Component({
  selector: 'app-tickets-tours',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tickets-tours.component.html',
  styleUrl: './tickets-tours.component.scss',
})
export class TicketsToursComponent implements AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  activeTab = signal<TabType>('flight');

  // ---- ADVANCED HERO BANNER SLIDER ----
  activeSlideIndex = signal(0);
  heroMouseX = signal(0);
  heroMouseY = signal(0);
  isSlideAnimating = signal(false);
  progressBarWidth = signal(0);
  isResettingProgress = signal(false);
  private slideTimer: any;

  readonly slides = [
    {
      title: 'Khám Phá Kỳ Quan Việt Nam',
      subtitle: 'Hành trình di sản trải dài từ vịnh Hạ Long kỳ vĩ đến phố cổ Hội An cổ kính, đưa bạn đắm chìm trong vẻ đẹp bất tận.',
      bgType: 'video',
      bgUrl: 'https://assets.mixkit.co/videos/preview/mixkit-beautiful-waterfall-in-a-lush-forest-1218-large.mp4',
      ctaText: 'Khám phá ngay'
    },
    {
      title: 'Sapa Nơi Gặp Gỡ Đất Trời',
      subtitle: 'Khám phá ruộng bậc thang kỳ vĩ ẩn hiện trong sương mờ và chinh phục đỉnh Fansipan 3.143m - Nóc nhà Đông Dương.',
      bgType: 'image',
      bgUrl: 'https://images.unsplash.com/photo-1504457047768-4a1864d4b3c1?auto=format&fit=crop&w=1920&q=80',
      ctaText: 'Xem hành trình'
    },
    {
      title: 'Nắng Vàng Biển Xanh Phú Quốc',
      subtitle: 'Thiên đường đảo ngọc vẫy gọi với những bãi cát trắng mịn màng, rặng san hô rực rỡ và hoàng hôn tím tuyệt đẹp.',
      bgType: 'image',
      bgUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
      ctaText: 'Đặt vé ngay'
    }
  ];

  currentSlide = computed(() => this.slides[this.activeSlideIndex()]);
  titleWords = computed(() => this.currentSlide().title.split(' '));

  // ---- FLIGHT ----
  flightFrom = signal('HAN');
  flightTo = signal('SGN');
  flightDate = signal(this.getTodayPlus(3));
  flightPassengers = signal(1);
  flightClass = signal<'economy' | 'business'>('economy');

  // ---- TRAIN ----
  trainFrom = signal('HN');
  trainTo = signal('SGN');
  trainDate = signal(this.getTodayPlus(5));
  trainClass = signal('Nằm điều hoà');

  // ---- BUS ----
  busFrom = signal('Hà Nội');
  busTo = signal('Đà Nẵng');
  busDate = signal(this.getTodayPlus(2));

  // ---- TOURS ----
  tourFilter = signal<'ALL' | 'NORTH' | 'CENTRAL' | 'SOUTH' | 'ISLAND'>('ALL');

  readonly airports: Airport[] = [
    { code: 'HAN', name: 'Nội Bài', city: 'Hà Nội' },
    { code: 'SGN', name: 'Tân Sơn Nhất', city: 'TP. Hồ Chí Minh' },
    { code: 'DAD', name: 'Đà Nẵng', city: 'Đà Nẵng' },
    { code: 'PQC', name: 'Phú Quốc', city: 'Phú Quốc' },
    { code: 'CXR', name: 'Cam Ranh', city: 'Nha Trang' },
    { code: 'HPH', name: 'Cát Bi', city: 'Hải Phòng' },
    { code: 'VCA', name: 'Cần Thơ', city: 'Cần Thơ' },
    { code: 'VII', name: 'Vinh', city: 'Nghệ An' },
    { code: 'VDH', name: 'Đồng Hới', city: 'Quảng Bình' },
    { code: 'DLI', name: 'Liên Khương', city: 'Đà Lạt' },
  ];

  readonly trainStations: TrainStation[] = [
    { code: 'HN', name: 'Ga Hà Nội' },
    { code: 'SGN', name: 'Ga Sài Gòn' },
    { code: 'DN', name: 'Ga Đà Nẵng' },
    { code: 'HUE', name: 'Ga Huế' },
    { code: 'NT', name: 'Ga Nha Trang' },
    { code: 'QN', name: 'Ga Quy Nhơn' },
    { code: 'VT', name: 'Ga Vinh' },
    { code: 'NH', name: 'Ga Ninh Hòa' },
  ];

  readonly trainClasses = ['Ngồi mềm', 'Ngồi cứng điều hoà', 'Nằm cứng điều hoà', 'Nằm điều hoà', 'VIP 2 chỗ'];

  readonly tourFilters = [
    { key: 'ALL', label: '🌏 Tất cả', count: 8 },
    { key: 'NORTH', label: '🏔️ Miền Bắc', count: 2 },
    { key: 'CENTRAL', label: '🏮 Miền Trung', count: 2 },
    { key: 'SOUTH', label: '🌆 Miền Nam', count: 2 },
    { key: 'ISLAND', label: '🏝️ Đảo & Biển', count: 2 },
  ] as const;

  readonly popularRoutes = [
    { from: 'HAN', to: 'SGN', fromCity: 'Hà Nội', toCity: 'TP.HCM', price: 'Từ 699k', img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=300&q=70' },
    { from: 'SGN', to: 'PQC', fromCity: 'TP.HCM', toCity: 'Phú Quốc', price: 'Từ 499k', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=70' },
    { from: 'HAN', to: 'DAD', fromCity: 'Hà Nội', toCity: 'Đà Nẵng', price: 'Từ 599k', img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=300&q=70' },
    { from: 'SGN', to: 'CXR', fromCity: 'TP.HCM', toCity: 'Nha Trang', price: 'Từ 449k', img: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&w=300&q=70' }
  ];

  readonly tourPackages: TourPackage[] = [
    {
      name: 'Tour Hà Nội - Hạ Long - Ninh Bình 4N3Đ',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
      location: 'Hà Nội - Quảng Ninh - Ninh Bình',
      duration: '4 ngày 3 đêm', rating: 4.8, reviewCount: 1243,
      price: 4200000, originalPrice: 5500000,
      highlights: ['Ngủ trên thuyền Hạ Long', 'Chèo thuyền Tam Cốc', 'Khách sạn 4 sao'],
      bookingLink: 'https://www.booking.com/attractions/vn/hanoi-halong-ninhbinh-tour.vi.html?aid=2311236',
    },
    {
      name: 'Tour Sapa - Fansipan Chinh Phục Nóc Nhà Đông Dương 3N2Đ',
      image: 'https://images.unsplash.com/photo-1504457047768-4a1864d4b3c1?auto=format&fit=crop&w=600&q=80',
      location: 'Lào Cai - Sapa',
      duration: '3 ngày 2 đêm', rating: 4.9, reviewCount: 876,
      price: 4000000, originalPrice: 5200000,
      highlights: ['Cáp treo Fansipan 3143m', 'Homestay bản địa H\'Mông', 'Ruộng bậc thang'],
      bookingLink: 'https://www.booking.com/attractions/vn/sapa-fansipan-tour.vi.html?aid=2311236',
    },
    {
      name: 'Tour Đà Nẵng - Hội An - Huế 4N3Đ',
      image: 'https://images.unsplash.com/photo-1599970993714-9b2573fe3b87?auto=format&fit=crop&w=600&q=80',
      location: 'Đà Nẵng - Quảng Nam - Thừa Thiên Huế',
      duration: '4 ngày 3 đêm', rating: 4.8, reviewCount: 2156,
      price: 3600000, originalPrice: 4800000,
      highlights: ['Cầu Vàng Bà Nà Hills', 'Phố cổ Hội An về đêm', 'Đại Nội Huế'],
      bookingLink: 'https://www.booking.com/attractions/vn/danang-hoian-hue-tour.vi.html?aid=2311236',
    },
    {
      name: 'Hoi An Ancient Town Walking Tour',
      image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
      location: 'Hội An, Quảng Nam',
      duration: '1 ngày', rating: 4.9, reviewCount: 3421,
      price: 230000, originalPrice: 300000,
      highlights: ['Hướng dẫn viên chuyên nghiệp', 'Thử ẩm thực đường phố', 'Vé vào cửa'],
      bookingLink: 'https://www.booking.com/attractions/vn/hoi-an-walking-tour.vi.html?aid=2311236',
    },
    {
      name: 'Tour TP. Hồ Chí Minh - Mũi Né - Đà Lạt 5N4Đ',
      image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80',
      location: 'TP. HCM - Bình Thuận - Lâm Đồng',
      duration: '5 ngày 4 đêm', rating: 4.7, reviewCount: 654,
      price: 5800000, originalPrice: 7500000,
      highlights: ['Đồi cát Mũi Né', 'Thung lũng Tình Yêu Đà Lạt', 'Khách sạn cao cấp'],
      bookingLink: 'https://www.booking.com/attractions/vn/hcmc-muine-dalat-tour.vi.html?aid=2311236',
    },
    {
      name: 'Tour Cần Thơ - Châu Đốc Miền Tây Sông Nước 3N2Đ',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      location: 'Cần Thơ - An Giang',
      duration: '3 ngày 2 đêm', rating: 4.6, reviewCount: 432,
      price: 2800000, originalPrice: 3600000,
      highlights: ['Chợ nổi Cái Răng', 'Núi Sam Châu Đốc', 'Ẩm thực miền Tây'],
      bookingLink: 'https://www.booking.com/attractions/vn/cantho-chaudoc-tour.vi.html?aid=2311236',
    },
    {
      name: 'Tour Phú Quốc Khám Phá Đảo 3N2Đ',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      location: 'Phú Quốc, Kiên Giang',
      duration: '3 ngày 2 đêm', rating: 4.7, reviewCount: 1876,
      price: 5200000, originalPrice: 6800000,
      highlights: ['Bãi Sao đẹp nhất VN', 'Lặn ngắm san hô', 'Resort 5 sao'],
      bookingLink: 'https://www.booking.com/attractions/vn/phu-quoc-island-tour.vi.html?aid=2311236',
    },
    {
      name: 'Ha Long Bay Deluxe Day Cruise',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
      location: 'Hạ Long, Quảng Ninh',
      duration: '1 ngày', rating: 4.8, reviewCount: 2890,
      price: 1390000, originalPrice: 1800000,
      highlights: ['Du thuyền 5 sao', 'Buffet hải sản', 'Chèo kayak hang động'],
      bookingLink: 'https://www.booking.com/attractions/vn/halong-bay-cruise.vi.html?aid=2311236',
    },
  ];

  readonly tourRegionMap: Record<string, string[]> = {
    NORTH: ['Tour Hà Nội - Hạ Long - Ninh Bình 4N3Đ', 'Tour Sapa - Fansipan Chinh Phục Nóc Nhà Đông Dương 3N2Đ'],
    CENTRAL: ['Tour Đà Nẵng - Hội An - Huế 4N3Đ', 'Hoi An Ancient Town Walking Tour'],
    SOUTH: ['Tour TP. Hồ Chí Minh - Mũi Né - Đà Lạt 5N4Đ', 'Tour Cần Thơ - Châu Đốc Miền Tây Sông Nước 3N2Đ'],
    ISLAND: ['Tour Phú Quốc Khám Phá Đảo 3N2Đ', 'Ha Long Bay Deluxe Day Cruise'],
  };

  filteredTours = computed(() => {
    const f = this.tourFilter();
    if (f === 'ALL') return this.tourPackages;
    const names = this.tourRegionMap[f] || [];
    return this.tourPackages.filter(t => names.includes(t.name));
  });

  // ---- EVENT LISTENERS FOR MICRO-INTERACTIONS ----

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.initSlideshow();
      setTimeout(() => {
        this.initMagneticButtons();
        this.initScrollAnimations();
      }, 500);
    }
  }

  ngOnDestroy() {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
  }

  // ---- SLIDESHOW LOGIC ----
  initSlideshow() {
    this.resetProgressBar();
    this.slideTimer = setInterval(() => {
      this.nextSlide();
    }, 6000);
  }

  resetProgressBar() {
    this.isResettingProgress.set(true);
    this.progressBarWidth.set(0);
    setTimeout(() => {
      this.isResettingProgress.set(false);
      this.progressBarWidth.set(100);
    }, 50);
  }

  nextSlide() {
    if (this.isSlideAnimating()) return;
    this.isSlideAnimating.set(true);
    this.resetProgressBar();
    
    setTimeout(() => {
      this.activeSlideIndex.update((current) => (current + 1) % this.slides.length);
      this.isSlideAnimating.set(false);
    }, 600);
  }

  prevSlide() {
    if (this.isSlideAnimating()) return;
    this.isSlideAnimating.set(true);
    this.resetProgressBar();
    
    setTimeout(() => {
      this.activeSlideIndex.update((current) => (current - 1 + this.slides.length) % this.slides.length);
      this.isSlideAnimating.set(false);
    }, 600);
  }

  selectSlide(index: number) {
    if (index === this.activeSlideIndex() || this.isSlideAnimating()) return;
    this.isSlideAnimating.set(true);
    this.resetProgressBar();
    
    setTimeout(() => {
      this.activeSlideIndex.set(index);
      this.isSlideAnimating.set(false);
    }, 600);
  }

  onHeroMouseMove(event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    
    // Parallax ngược hướng di chuyển chuột tối đa 15px
    const moveX = -(x / (rect.width / 2)) * 15;
    const moveY = -(y / (rect.height / 2)) * 15;
    
    this.heroMouseX.set(moveX);
    this.heroMouseY.set(moveY);
  }

  onHeroMouseLeave() {
    this.heroMouseX.set(0);
    this.heroMouseY.set(0);
  }

  // ---- MAGNETIC BUTTONS ----
  initMagneticButtons() {
    const buttons = document.querySelectorAll('.magnetic-btn');
    buttons.forEach((btn: any) => {
      btn.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        // Hút lệch tâm tối đa 15px
        btn.style.transform = `translate3d(${x * 0.35}px, ${y * 0.35}px, 0)`;
        btn.style.transition = 'none';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0, 0, 0)';
        btn.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
      });
    });
  }

  // ---- SCROLL ANIMATIONS ----
  initScrollAnimations() {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));
  }

  private getTodayPlus(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  setTab(tab: TabType) { this.activeTab.set(tab); }
  setTourFilter(f: 'ALL' | 'NORTH' | 'CENTRAL' | 'SOUTH' | 'ISLAND') { this.tourFilter.set(f); }

  searchFlights() {
    const from = this.flightFrom();
    const to = this.flightTo();
    const date = this.flightDate();
    const passengers = this.flightPassengers();
    const cls = this.flightClass() === 'business' ? 'BUSINESS' : 'ECONOMY';
    const url = `https://flights.booking.com/flights/${from}.AIRPORT-${to}.AIRPORT/?aid=2311236&adults=${passengers}&cabinClass=${cls}&depart=${date}`;
    window.open(url, '_blank');
  }

  searchTrains() {
    const url = `https://dsvn.vn/?from=${this.trainFrom()}&to=${this.trainTo()}&date=${this.trainDate()}`;
    window.open(url, '_blank');
  }

  searchBuses() {
    const url = `https://vexere.com/vi-VN/ve-xe-khach-tu-${this.busFrom().toLowerCase().replace(/ /g, '-')}-di-${this.busTo().toLowerCase().replace(/ /g, '-')}.htm`;
    window.open(url, '_blank');
  }

  bookTour(link: string) {
    window.open(link, '_blank');
  }

  swapFlightCities() {
    const tmp = this.flightFrom();
    this.flightFrom.set(this.flightTo());
    this.flightTo.set(tmp);
  }

  discountPercent(original: number, current: number): number {
    return Math.round(((original - current) / original) * 100);
  }

  formatPrice(price: number): string {
    return price === 0 ? 'Miễn phí' : price.toLocaleString('vi-VN') + 'đ';
  }
}
