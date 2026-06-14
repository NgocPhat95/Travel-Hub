import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TravelGuide } from '../travel-guides/travel-guides.component';

// Full article content (rich markdown-like HTML articles)
const ARTICLES: Record<string, TravelGuide & { content: string; relatedSlugs: string[] }> = {
  'top-10-nha-hang-ven-song-sai-gon': {
    slug: 'top-10-nha-hang-ven-song-sai-gon',
    title: 'Top 10 nhà hàng ven sông Sài Gòn không thể bỏ lỡ năm 2026',
    excerpt: 'Từ The Deck Saigon đến những quán cóc bình dân với tầm nhìn sông thơ mộng.',
    category: 'FOOD',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85',
    readTime: 7, date: '08/06/2026',
    isFeatured: true,
    author: { name: 'Minh Châu', avatar: 'https://i.pravatar.cc/80?img=5' },
    tags: ['Ẩm thực', 'Sài Gòn', 'Nhà hàng', 'Ven sông'],
    relatedSlugs: ['am-thuc-ha-noi-36-pho-phuong', 'homestay-vs-khach-san-nen-chon-gi'],
    content: `
      <p class="lead">Sài Gòn không chỉ nổi tiếng với nhịp sống sôi động mà còn ẩn chứa những địa điểm ẩm thực tuyệt vời dọc theo bờ sông Sài Gòn thơ mộng. Dưới đây là 10 nhà hàng ven sông được du khách và thực khách yêu thích nhất.</p>

      <h2>1. The Deck Saigon — Thảo Điền, Quận 2</h2>
      <p>Nằm yên bình bên bờ sông tại khu Thảo Điền, The Deck Saigon là địa điểm lý tưởng thưởng thức ẩm thực Pan-Asian trong không gian mở đón gió sông tự nhiên. Hãy đặt bàn trước khi đến để có chỗ đẹp nhất nhìn ra sông.</p>
      <blockquote>💡 <strong>Mẹo:</strong> Đặt bàn vào lúc 17h30 để kịp ngắm hoàng hôn trên sông Sài Gòn — khung cảnh đẹp không kém gì các thành phố nổi tiếng thế giới.</blockquote>

      <h2>2. Crab House Saigon — Bến Bạch Đằng</h2>
      <p>Chuyên về hải sản tươi sống với view nhìn thẳng ra sông Sài Gòn và Thủ Thiêm. Menu đa dạng từ cua, tôm, mực đến các món Âu kết hợp. Không gian rộng rãi, phù hợp gia đình.</p>

      <h2>3. Rain — Rooftop Restaurant</h2>
      <p>Tọa lạc trên tầng cao của một toà nhà ven sông, Rain mang đến không gian ăn uống sang trọng với view 360 độ. Thực đơn fine dining Á-Âu kết hợp, wine list phong phú.</p>

      <h2>Lưu ý khi đến các nhà hàng ven sông Sài Gòn</h2>
      <ul>
        <li>Nên đặt bàn trước ít nhất 2–3 ngày vào cuối tuần</li>
        <li>Thời điểm lý tưởng nhất là từ 17h–19h để ngắm hoàng hôn</li>
        <li>Giá cả thường cao hơn nhà hàng thông thường 20–40%</li>
        <li>Mùa mưa (tháng 5–11) thường có gió mạnh ở không gian ngoài trời</li>
      </ul>
    `,
  },
  'kham-pha-vinh-ha-long-toan-tap': {
    slug: 'kham-pha-vinh-ha-long-toan-tap',
    title: 'Cẩm nang khám phá Vịnh Hạ Long từ A đến Z — Tour, Thời điểm & Kinh nghiệm',
    excerpt: 'Hướng dẫn đầy đủ về cách lên kế hoạch chuyến đi Hạ Long.',
    category: 'ATTRACTION',
    coverImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=85',
    readTime: 12, date: '06/06/2026',
    author: { name: 'Thanh Tùng', avatar: 'https://i.pravatar.cc/80?img=3' },
    tags: ['Hạ Long', 'Tour', 'Thiên nhiên'],
    relatedSlugs: ['bai-bien-dep-mien-trung', 'meo-du-lich-tiet-kiem-he-2026'],
    content: `
      <p class="lead">Vịnh Hạ Long — kỳ quan thiên nhiên thế giới được UNESCO công nhận hai lần — là điểm đến mơ ước của hàng triệu du khách toàn cầu. Với hơn 1.600 hòn đảo đá vôi hùng vĩ, Hạ Long luôn khiến người ta phải trầm trồ.</p>

      <h2>Thời điểm tốt nhất để đến Hạ Long</h2>
      <p>Hạ Long đẹp nhất vào mùa hè (tháng 4–8) khi trời nắng đẹp, nhiệt độ ấm áp phù hợp tắm biển và chèo kayak. Tháng 9–11 cũng lý tưởng với ít du khách hơn và tiết trời dễ chịu.</p>

      <h2>Các loại tour phù hợp</h2>
      <ul>
        <li><strong>Tour ngày:</strong> Phù hợp cho người ít thời gian, giá 800k–1.5 triệu/người</li>
        <li><strong>Tour 2 ngày 1 đêm:</strong> Ngủ trên thuyền, trải nghiệm đầy đủ hơn</li>
        <li><strong>Tour 3 ngày 2 đêm:</strong> Dành cho người muốn khám phá sâu, tham quan hang động, đảo xa</li>
      </ul>

      <blockquote>💡 <strong>Mẹo tiết kiệm:</strong> Đặt tour qua các đại lý địa phương tại Hạ Long thường rẻ hơn 20–30% so với đặt trực tuyến từ Hà Nội hoặc TP.HCM.</blockquote>

      <h2>Những điểm không thể bỏ qua</h2>
      <p>Hang Sửng Sốt, Đảo Ti Tốp, Hang Đầu Gỗ và làng chài Cửa Vạn là những điểm tham quan nổi tiếng nhất. Nếu có thêm thời gian, hãy khám phá vịnh Bái Tử Long ít đông đúc hơn nhưng không kém phần đẹp.</p>
    `,
  },
};

@Component({
  selector: 'app-travel-guide-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './travel-guide-detail.component.html',
  styleUrl: './travel-guide-detail.component.scss',
})
export class TravelGuideDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  article = signal<(TravelGuide & { content: string; relatedSlugs: string[] }) | null>(null);
  notFound = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') || '';
      const found = ARTICLES[slug];
      if (found) {
        this.article.set(found);
        this.notFound.set(false);
      } else {
        this.article.set(null);
        this.notFound.set(true);
      }
    });
  }

  getCategoryLabel(cat: string): string {
    const map: Record<string, string> = { FOOD: 'Ẩm thực', HOTEL: 'Lưu trú', ATTRACTION: 'Khám phá', TIPS: 'Mẹo du lịch' };
    return map[cat] || cat;
  }

  getCategoryIcon(cat: string): string {
    const map: Record<string, string> = { FOOD: '🍜', HOTEL: '🏨', ATTRACTION: '🗺️', TIPS: '💡' };
    return map[cat] || '📖';
  }

  getRelatedArticles(slugs: string[]) {
    return slugs.map(s => ARTICLES[s]).filter(Boolean);
  }
}
