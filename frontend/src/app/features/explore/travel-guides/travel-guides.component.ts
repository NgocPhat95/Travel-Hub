import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface TravelGuide {
  slug: string;
  title: string;
  excerpt: string;
  category: 'FOOD' | 'HOTEL' | 'ATTRACTION' | 'TIPS';
  coverImage: string;
  readTime: number;
  date: string;
  isFeatured?: boolean;
  author: { name: string; avatar: string };
  tags: string[];
}

@Component({
  selector: 'app-travel-guides',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './travel-guides.component.html',
  styleUrl: './travel-guides.component.scss',
})
export class TravelGuidesComponent {
  activeFilter = signal<'ALL' | 'FOOD' | 'HOTEL' | 'ATTRACTION' | 'TIPS'>('ALL');

  readonly filters = [
    { key: 'ALL', label: 'Tất cả', icon: '✨' },
    { key: 'FOOD', label: 'Ẩm thực', icon: '🍜' },
    { key: 'HOTEL', label: 'Lưu trú', icon: '🏨' },
    { key: 'ATTRACTION', label: 'Khám phá', icon: '🗺️' },
    { key: 'TIPS', label: 'Mẹo du lịch', icon: '💡' },
  ] as const;

  readonly guides: TravelGuide[] = [
    {
      slug: 'top-10-nha-hang-ven-song-sai-gon',
      title: 'Top 10 nhà hàng ven sông Sài Gòn không thể bỏ lỡ năm 2026',
      excerpt: 'Từ The Deck Saigon đến những quán cóc bình dân với tầm nhìn sông thơ mộng — đây là danh sách những địa chỉ ăn uống ven sông tuyệt vời nhất Thành phố Hồ Chí Minh mà bất kỳ thực khách nào cũng nên thử qua.',
      category: 'FOOD',
      coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      readTime: 7,
      date: '08/06/2026',
      isFeatured: true,
      author: { name: 'Minh Châu', avatar: 'https://i.pravatar.cc/40?img=5' },
      tags: ['Ẩm thực', 'Sài Gòn', 'Nhà hàng', 'Ven sông'],
    },
    {
      slug: 'kham-pha-vinh-ha-long-toan-tap',
      title: 'Cẩm nang khám phá Vịnh Hạ Long từ A đến Z — Tour, Thời điểm & Kinh nghiệm',
      excerpt: 'Hạ Long là kỳ quan thiên nhiên thế giới với hơn 1.600 hòn đảo đá vôi. Hướng dẫn đầy đủ về cách lên kế hoạch chuyến đi, loại tour phù hợp và những điều cần lưu ý để có chuyến trải nghiệm trọn vẹn nhất.',
      category: 'ATTRACTION',
      coverImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      readTime: 12,
      date: '06/06/2026',
      isFeatured: false,
      author: { name: 'Thanh Tùng', avatar: 'https://i.pravatar.cc/40?img=3' },
      tags: ['Hạ Long', 'Tour', 'Thiên nhiên'],
    },
    {
      slug: '5-khach-san-sang-trong-da-nang',
      title: '5 khách sạn nghỉ dưỡng sang trọng nhất Đà Nẵng: Đánh giá thực tế từ du khách',
      excerpt: 'Đà Nẵng có dải khách sạn ven biển đẳng cấp thế giới. Chúng tôi đã trải nghiệm và đánh giá trực tiếp 5 resort 5 sao hàng đầu để giúp bạn chọn lựa hoàn hảo cho kỳ nghỉ tiếp theo.',
      category: 'HOTEL',
      coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      readTime: 9,
      date: '04/06/2026',
      isFeatured: false,
      author: { name: 'Linh Nguyễn', avatar: 'https://i.pravatar.cc/40?img=9' },
      tags: ['Đà Nẵng', 'Resort', 'Nghỉ dưỡng', '5 sao'],
    },
    {
      slug: 'meo-du-lich-tiet-kiem-he-2026',
      title: '15 mẹo du lịch tiết kiệm mùa hè 2026 dành cho giới trẻ',
      excerpt: 'Du lịch không nhất thiết phải tốn kém. Với 15 bí quyết này — từ đặt vé máy bay đúng thời điểm, lựa chọn chỗ lưu trú thông minh đến ăn uống như người địa phương — bạn có thể tối ưu hóa ngân sách và vẫn tận hưởng chuyến đi tuyệt vời.',
      category: 'TIPS',
      coverImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
      readTime: 6,
      date: '02/06/2026',
      isFeatured: false,
      author: { name: 'Quốc Bảo', avatar: 'https://i.pravatar.cc/40?img=12' },
      tags: ['Mẹo hay', 'Tiết kiệm', 'Giới trẻ'],
    },
    {
      slug: 'am-thuc-ha-noi-36-pho-phuong',
      title: 'Hành trình ẩm thực 36 phố phường Hà Nội: Những món không thể bỏ qua',
      excerpt: 'Phở, bún chả, chả cá Lã Vọng, bánh cuốn Thanh Trì... Hà Nội là thiên đường ẩm thực với hàng trăm món ngon truyền thống. Khám phá hành trình ăn uống trong lòng phố cổ nghìn năm.',
      category: 'FOOD',
      coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
      readTime: 8,
      date: '30/05/2026',
      isFeatured: false,
      author: { name: 'Hà My', avatar: 'https://i.pravatar.cc/40?img=7' },
      tags: ['Hà Nội', 'Ẩm thực', 'Phố cổ'],
    },
    {
      slug: 'homestay-vs-khach-san-nen-chon-gi',
      title: 'Homestay hay Khách sạn? So sánh chi tiết để chọn lựa phù hợp nhất',
      excerpt: 'Mỗi loại hình lưu trú đều có ưu và nhược điểm riêng. Bài viết phân tích toàn diện từ chi phí, trải nghiệm, tiện nghi đến sự phù hợp với từng kiểu chuyến đi để giúp bạn ra quyết định đúng đắn.',
      category: 'HOTEL',
      coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      readTime: 5,
      date: '28/05/2026',
      isFeatured: false,
      author: { name: 'An Thư', avatar: 'https://i.pravatar.cc/40?img=15' },
      tags: ['Lưu trú', 'Homestay', 'Khách sạn', 'So sánh'],
    },
    {
      slug: 'bai-bien-dep-mien-trung',
      title: 'Những bãi biển đẹp mê hồn ở miền Trung Việt Nam ít người biết đến',
      excerpt: 'Ngoài những bãi biển nổi tiếng như Mỹ Khê, Lăng Cô, Việt Nam còn ẩn chứa những bãi biển hoang sơ, trong xanh tuyệt đẹp chỉ dành cho những ai thích khám phá. Hành trình dọc theo "con đường di sản" miền Trung.',
      category: 'ATTRACTION',
      coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      readTime: 10,
      date: '25/05/2026',
      isFeatured: false,
      author: { name: 'Gia Huy', avatar: 'https://i.pravatar.cc/40?img=20' },
      tags: ['Biển', 'Miền Trung', 'Hoang sơ'],
    },
    {
      slug: 'ung-dung-du-lich-thong-minh',
      title: '10 ứng dụng du lịch thông minh không thể thiếu khi đi khám phá Việt Nam',
      excerpt: 'Từ Google Maps offline, Grab, ứng dụng dịch thuật tức thì đến các app đặt phòng, đặt bàn ăn — bộ công cụ số này sẽ biến mọi chuyến đi của bạn trở nên suôn sẻ và thú vị hơn bao giờ hết.',
      category: 'TIPS',
      coverImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
      readTime: 4,
      date: '20/05/2026',
      isFeatured: false,
      author: { name: 'Minh Châu', avatar: 'https://i.pravatar.cc/40?img=5' },
      tags: ['Công nghệ', 'Ứng dụng', 'Mẹo hay'],
    },
  ];

  filteredGuides = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'ALL') return this.guides;
    return this.guides.filter(g => g.category === filter);
  });

  featuredGuide = computed(() => this.guides.find(g => g.isFeatured));
  nonFeaturedGuides = computed(() => {
    const filter = this.activeFilter();
    const list = filter === 'ALL' ? this.guides.filter(g => !g.isFeatured) : this.guides.filter(g => g.category === filter);
    return list;
  });

  setFilter(f: 'ALL' | 'FOOD' | 'HOTEL' | 'ATTRACTION' | 'TIPS') {
    this.activeFilter.set(f);
  }

  getCategoryLabel(cat: string): string {
    const map: Record<string, string> = { FOOD: 'Ẩm thực', HOTEL: 'Lưu trú', ATTRACTION: 'Khám phá', TIPS: 'Mẹo du lịch' };
    return map[cat] || cat;
  }

  getCategoryColor(cat: string): string {
    const map: Record<string, string> = {
      FOOD: 'category-food', HOTEL: 'category-hotel',
      ATTRACTION: 'category-attraction', TIPS: 'category-tips',
    };
    return map[cat] || '';
  }

  getCategoryIcon(cat: string): string {
    const map: Record<string, string> = { FOOD: '🍜', HOTEL: '🏨', ATTRACTION: '🗺️', TIPS: '💡' };
    return map[cat] || '📖';
  }
}
