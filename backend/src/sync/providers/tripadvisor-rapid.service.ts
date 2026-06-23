import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * TripAdvisor via RapidAPI — nguồn dữ liệu CHÍNH
 * Host: tripadvisor16.p.rapidapi.com
 * Bao gồm: Khách sạn, Nhà hàng, Điểm tham quan, Tour
 */
@Injectable()
export class TripAdvisorRapidService {
  private readonly logger = new Logger(TripAdvisorRapidService.name);
  private readonly rapidApiKey: string;
  private readonly host = 'tripadvisor16.p.rapidapi.com';
  private readonly baseUrl = `https://${this.host}`;

  // TripAdvisor geoId cho các thành phố Việt Nam
  private readonly vietnamLocations = [
    { geoId: '293924', city: 'Hà Nội' },
    { geoId: '293925', city: 'TP. Hồ Chí Minh' },
    { geoId: '298085', city: 'Đà Nẵng' },
    { geoId: '298082', city: 'Hội An' },
    { geoId: '293979', city: 'Nha Trang' },
    { geoId: '469418', city: 'Phú Quốc' },
    { geoId: '303880', city: 'Huế' },
    { geoId: '303946', city: 'Đà Lạt' },
    { geoId: '1371476', city: 'Hạ Long' },
    { geoId: '303868', city: 'Sapa' },
    { geoId: '1564757', city: 'Ninh Bình' },
    { geoId: '311297', city: 'Vũng Tàu' },
    { geoId: '311346', city: 'Cần Thơ' },
    { geoId: '676340', city: 'Quy Nhơn' },
    { geoId: '1507759', city: 'Phong Nha' },
  ];

  constructor(private readonly httpService: HttpService) {
    this.rapidApiKey = process.env.RAPIDAPI_KEY || '';
  }

  private get headers() {
    return {
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': this.host,
    };
  }

  // ─────────────────────────────────────────────
  //  HOTELS
  // ─────────────────────────────────────────────

  async searchHotels(geoId: string, city: string): Promise<any[]> {
    if (!this.rapidApiKey) return [];

    const today = new Date();
    const checkin = new Date(today);
    checkin.setDate(today.getDate() + 7);
    const checkout = new Date(checkin);
    checkout.setDate(checkin.getDate() + 2);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/hotels/searchHotels`, {
          headers: this.headers,
          params: {
            geoId,
            checkIn: fmt(checkin),
            checkOut: fmt(checkout),
            adults: '2',
            rooms: '1',
            currencyCode: 'VND',
            languageCode: 'vi',
          },
        }),
      );

      const hotels = res.data?.data?.data || res.data?.data || [];
      this.logger.log(`[TripAdvisor] Hotels in ${city}: ${hotels.length}`);
      return hotels.slice(0, 40).map((h: any) => this.normalizeHotel(h, city));
    } catch (err: any) {
      this.logger.error(`[TripAdvisor] Hotel search failed for ${city}: ${err.message}`);
      return [];
    }
  }

  async fetchAllVietnamHotels(): Promise<any[]> {
    const all: any[] = [];
    for (const loc of this.vietnamLocations) {
      const hotels = await this.searchHotels(loc.geoId, loc.city);
      all.push(...hotels);
      await this.sleep(400);
    }
    return all;
  }

  // ─────────────────────────────────────────────
  //  RESTAURANTS
  // ─────────────────────────────────────────────

  async searchRestaurants(geoId: string, city: string): Promise<any[]> {
    if (!this.rapidApiKey) return [];
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/restaurant/searchRestaurants`, {
          headers: this.headers,
          params: { locationId: geoId },
        }),
      );
      const list = res.data?.data?.data || [];
      this.logger.log(`[TripAdvisor] Restaurants in ${city}: ${list.length}`);
      return list.slice(0, 40).map((r: any) => this.normalizeRestaurant(r, city));
    } catch (err: any) {
      this.logger.error(`[TripAdvisor] Restaurant search failed for ${city}: ${err.message}`);
      return [];
    }
  }

  async fetchAllVietnamRestaurants(): Promise<any[]> {
    const all: any[] = [];
    for (const loc of this.vietnamLocations) {
      const items = await this.searchRestaurants(loc.geoId, loc.city);
      all.push(...items);
      await this.sleep(400);
    }
    return all;
  }

  // ─────────────────────────────────────────────
  //  ATTRACTIONS & TOURS
  // ─────────────────────────────────────────────

  async searchAttractions(geoId: string, city: string): Promise<any[]> {
    if (!this.rapidApiKey) return [];
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/attraction/searchAttractions`, {
          headers: this.headers,
          params: { locationId: geoId },
        }),
      );
      const list = res.data?.data?.data || [];
      this.logger.log(`[TripAdvisor] Attractions in ${city}: ${list.length}`);
      return list.slice(0, 30).map((a: any) => this.normalizeAttraction(a, city));
    } catch (err: any) {
      this.logger.error(`[TripAdvisor] Attraction search failed for ${city}: ${err.message}`);
      return [];
    }
  }

  async fetchAllVietnamAttractions(): Promise<any[]> {
    const all: any[] = [];
    for (const loc of this.vietnamLocations) {
      const items = await this.searchAttractions(loc.geoId, loc.city);
      all.push(...items);
      await this.sleep(400);
    }
    return all;
  }

  // ─────────────────────────────────────────────
  //  NORMALIZERS
  // ─────────────────────────────────────────────

  private normalizeHotel(h: any, city: string): any {
    const name = h.name || h.title || 'Khách sạn';
    const photo = h.cardPhotos?.[0]?.sizes?.urlTemplate?.replace('{width}', '800').replace('{height}', '600')
      || h.photos?.[0]?.url
      || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';

    const bubbleRating = h.bubbleRating?.rating || h.rating || 4.0;
    const priceRaw = h.priceForDisplay?.string || h.rawPrice || '';
    const priceNum = this.parsePrice(priceRaw) || 800000;

    return {
      externalId: `tripadvisor_hotel_${h.id || h.locationId}`,
      name,
      description: `🏨 ${name} tại ${city}. ${h.primaryInfo || ''} ${h.secondaryInfo || ''} - Đánh giá TripAdvisor: ${bubbleRating}/5`.trim(),
      category: 'HOTEL',
      city,
      address: h.address || `${city}, Việt Nam`,
      latitude: h.latitude || 0,
      longitude: h.longitude || 0,
      priceMin: Math.round(priceNum * 0.8),
      priceMax: Math.round(priceNum * 1.5),
      priceRange: priceRaw || `${Math.round(priceNum).toLocaleString('vi-VN')}đ/đêm`,
      avgRating: Math.min(5, parseFloat(String(bubbleRating))),
      amenities: this.hotelAmenities(h),
      images: [photo],
      partnerPrice: priceNum,
      partnerLink: h.commerceInfo?.externalUrl || (h.id ? `https://www.tripadvisor.com.vn/Hotel_Review-${h.id}` : `https://www.tripadvisor.com.vn/Hotels-g${h.locationId}-${city.replace(/\s/g, '_')}-Hotels.html`),
      source: 'TRIPADVISOR',
      partnerName: 'TRIPADVISOR',
    };
  }

  private normalizeRestaurant(r: any, city: string): any {
    // 1. Photo
    let photo = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80';
    if (r.heroImgUrl) {
      photo = r.heroImgUrl;
    } else if (r.photos?.[0]?.images?.original?.url) {
      photo = r.photos[0].images.original.url;
    } else if (r.photo?.images?.original?.url) {
      photo = r.photo.images.original.url;
    } else if (r.squareImgUrl) {
      photo = r.squareImgUrl;
    }

    // 2. Price Tag / Range
    const priceTag = r.priceTag || r.price_level || r.priceLevel || '$$';
    let minPrice = 150000;
    let maxPrice = 500000;
    let priceRangeLabel = '150K - 500K';

    if (priceTag === '$' || priceTag.includes('Giá rẻ') || priceTag.includes('Cheap')) {
      minPrice = 50000;
      maxPrice = 200000;
      priceRangeLabel = '50K - 200K';
    } else if (priceTag === '$$' || priceTag === '$$ - $$$' || priceTag === 'Medium' || priceTag.includes('$$')) {
      minPrice = 150000;
      maxPrice = 500000;
      priceRangeLabel = '150K - 500K';
    } else if (priceTag === '$$$' || priceTag === 'Expensive') {
      minPrice = 400000;
      maxPrice = 1500000;
      priceRangeLabel = '400K - 1.5M';
    } else if (priceTag === '$$$$' || priceTag === 'Luxury') {
      minPrice = 1000000;
      maxPrice = 5000000;
      priceRangeLabel = '1M - 5M';
    }

    // 3. Cuisines / Amenities
    let cuisines: string[] = [];
    if (r.establishmentTypeAndCuisineTags) {
      cuisines = r.establishmentTypeAndCuisineTags;
    } else if (r.cuisine) {
      cuisines = r.cuisine.map((c: any) => c.localized_name || c.name).filter(Boolean);
    }

    // 4. Rating
    const rating = parseFloat(String(r.averageRating || r.rating || '4.5'));

    // 5. External ID & Location ID
    const locId = r.locationId || r.location_id || r.restaurantsId || Math.floor(Math.random() * 1000000);
    const extId = `tripadvisor_rest_${locId}`;

    // 6. Name
    const name = r.name || 'Nhà hàng';

    // 7. City / Address
    const finalCity = city || r.parentGeoName || 'Việt Nam';
    const address = r.address || r.address_obj?.address_string || `${finalCity}, Việt Nam`;

    // 8. Description
    const statusText = r.currentOpenStatusText ? ` [${r.currentOpenStatusText}]` : '';
    const desc = `🍜 ${name} - ${finalCity}.${statusText} Cơm, hải sản & ẩm thực địa phương. ${r.ranking_string || ''} ${r.description || ''}`.trim();

    // 9. Link
    let partnerLink = `https://www.tripadvisor.com.vn/Restaurant_Review-d${locId}`;
    if (r.web_url) {
      partnerLink = r.web_url;
    } else if (r.reviewSnippets?.reviewSnippetsList?.[0]?.reviewUrl) {
      partnerLink = `https://www.tripadvisor.com${r.reviewSnippets.reviewSnippetsList[0].reviewUrl}`;
    }

    return {
      externalId: extId,
      name,
      description: desc,
      category: 'RESTAURANT',
      city: finalCity,
      address,
      latitude: parseFloat(String(r.latitude || '0')),
      longitude: parseFloat(String(r.longitude || '0')),
      priceMin: minPrice,
      priceMax: maxPrice,
      priceRange: priceRangeLabel,
      avgRating: rating,
      amenities: cuisines.length ? cuisines.slice(0, 5) : ['Món ăn Việt', 'Không gian ấm cúng'],
      images: [photo],
      partnerPrice: minPrice,
      partnerLink,
      source: 'TRIPADVISOR',
      partnerName: 'TRIPADVISOR',
    };
  }

  private normalizeAttraction(a: any, city: string): any {
    const photo = a.cardPhotos?.[0]?.sizes?.urlTemplate?.replace('{width}', '800').replace('{height}', '600')
      || a.photo?.images?.original?.url
      || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80';

    const subcats = a.subcategory?.map((s: any) => s.localized_name || s.name).filter(Boolean) || [];
    const isTour = subcats.some((s: string) => /tour|activity|experience/i.test(s));

    return {
      externalId: `tripadvisor_attr_${a.location_id || a.id}`,
      name: a.name,
      description: `${isTour ? '🎭' : '🗺️'} ${a.name} - ${city}. ${a.ranking_string || ''} ${subcats.join(', ')}`.trim(),
      category: isTour ? 'TOUR' : 'ATTRACTION',
      city,
      address: a.address || a.address_obj?.address_string || `${city}, Việt Nam`,
      latitude: parseFloat(a.latitude || '0'),
      longitude: parseFloat(a.longitude || '0'),
      priceMin: 0,
      priceMax: 500000,
      priceRange: 'Xem chi tiết',
      avgRating: parseFloat(a.rating || '4.5'),
      amenities: ['Hướng dẫn viên', 'Trải nghiệm địa phương', ...subcats.slice(0, 2)],
      images: [photo],
      partnerPrice: 0,
      partnerLink: a.web_url || `https://www.tripadvisor.com.vn/Attraction_Review-d${a.location_id || a.id}`,
      source: 'TRIPADVISOR',
      partnerName: 'TRIPADVISOR',
    };
  }

  private hotelAmenities(h: any): string[] {
    const base = ['WiFi miễn phí', 'Đặt phòng linh hoạt'];
    const rating = h.bubbleRating?.rating || 0;
    if (rating >= 4.5) base.push('Xuất sắc trên TripAdvisor');
    if (h.amenitiesScreen?.length) {
      h.amenitiesScreen.slice(0, 3).forEach((a: any) => base.push(a.name || a.title));
    }
    return base.slice(0, 6);
  }

  private parsePrice(str: string): number {
    if (!str) return 0;
    const num = str.replace(/[^\d]/g, '');
    return num ? parseInt(num, 10) : 0;
  }

  private sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }
}
