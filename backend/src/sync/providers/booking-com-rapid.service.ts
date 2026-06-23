import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Booking.com via RapidAPI
 * Host: booking-com15.p.rapidapi.com
 * Docs: https://rapidapi.com/DataCrawler/api/booking-com15
 */
@Injectable()
export class BookingComRapidService {
  private readonly logger = new Logger(BookingComRapidService.name);
  private readonly rapidApiKey: string;
  private readonly host = 'booking-com15.p.rapidapi.com';
  private readonly baseUrl = `https://${this.host}`;

  constructor(private readonly httpService: HttpService) {
    this.rapidApiKey = process.env.RAPIDAPI_KEY || '';
  }

  private get headers() {
    return {
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': this.host,
    };
  }

  /**
   * Search dest_id for a city name dynamically using searchDestination
   */
  async searchLocationId(query: string): Promise<string | null> {
    if (!this.rapidApiKey) return null;
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/hotels/searchDestination`, {
          headers: this.headers,
          params: { query, languagecode: 'vi' },
        }),
      );
      const data = response.data?.data || response.data || [];
      const cityResult = data.find((item: any) => item.search_type === 'city' || item.dest_type === 'city') || data[0];
      if (cityResult?.dest_id) return String(cityResult.dest_id);
    } catch (err: any) {
      this.logger.warn(`[BookingCom] /hotels/searchDestination failed for ${query}: ${err.message}`);
    }

    return null;
  }

  /**
   * Search hotels in a Vietnam city
   */
  async searchHotels(destId: string, city: string, page = 1): Promise<any[]> {
    if (!this.rapidApiKey) {
      this.logger.warn('[BookingCom] No RapidAPI key configured. Skipping.');
      return [];
    }

    const today = new Date();
    const checkin = new Date(today);
    checkin.setDate(today.getDate() + 7);
    const checkout = new Date(checkin);
    checkout.setDate(checkin.getDate() + 2);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/hotels/searchHotels`, {
          headers: this.headers,
          params: {
            dest_id: destId,
            search_type: 'city',
            arrival_date: formatDate(checkin),
            departure_date: formatDate(checkout),
            adults: '2',
            children_age: '',
            room_qty: '1',
            page_number: String(page),
            languagecode: 'vi',
            currency_code: 'VND',
          },
        }),
      );

      const hotels = response.data?.data?.hotels || response.data?.hotels || [];
      this.logger.log(`[BookingCom] Fetched ${hotels.length} hotels for ${city}`);
      return hotels;
    } catch (err: any) {
      this.logger.error(`[BookingCom] Failed to fetch hotels for ${city}: ${err.message}`);
      return [];
    }
  }

  /**
   * Get hotel details by hotel ID
   */
  async getHotelDetails(hotelId: string): Promise<any | null> {
    if (!this.rapidApiKey) return null;
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/hotels/getHotelDetails`, {
          headers: this.headers,
          params: { hotel_id: hotelId, languagecode: 'vi', currency_code: 'VND' },
        }),
      );
      return response.data?.data || null;
    } catch (err: any) {
      this.logger.error(`[BookingCom] Failed to get hotel ${hotelId} details: ${err.message}`);
      return null;
    }
  }

  /**
   * Get hotel photos
   */
  async getHotelPhotos(hotelId: string): Promise<string[]> {
    if (!this.rapidApiKey) return [];
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/hotels/getHotelPhotos`, {
          headers: this.headers,
          params: { hotel_id: hotelId },
        }),
      );
      const photos = response.data?.data || [];
      return photos.slice(0, 5).map((p: any) => p.url_1440 || p.url_max || p.url || '').filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Fetch all hotels across popular Vietnam cities by dynamically resolving destIds
   */
  async fetchAllVietnamHotels(): Promise<any[]> {
    const cityMappings = [
      { name: 'Hanoi', vi: 'Hà Nội' },
      { name: 'Ho Chi Minh City', vi: 'TP. Hồ Chí Minh' },
      { name: 'Da Nang', vi: 'Đà Nẵng' },
      { name: 'Hoi An', vi: 'Hội An' },
      { name: 'Nha Trang', vi: 'Nha Trang' },
      { name: 'Phu Quoc', vi: 'Phú Quốc' },
      { name: 'Hue', vi: 'Huế' },
      { name: 'Da Lat', vi: 'Đà Lạt' },
      { name: 'Ha Long', vi: 'Hạ Long' },
      { name: 'Mui Ne', vi: 'Mũi Né' },
      { name: 'Sapa', vi: 'Sapa' },
      { name: 'Ninh Binh', vi: 'Ninh Bình' },
      { name: 'Vung Tau', vi: 'Vũng Tàu' },
      { name: 'Can Tho', vi: 'Cần Thơ' },
      { name: 'Quy Nhon', vi: 'Quy Nhơn' },
      { name: 'Phong Nha', vi: 'Phong Nha' }
    ];

    const all: any[] = [];
    for (const item of cityMappings) {
      this.logger.log(`[BookingCom] Resolving destId for ${item.name}...`);
      const destId = await this.searchLocationId(item.name);
      if (!destId) {
        this.logger.warn(`[BookingCom] Could not resolve destId for ${item.name}. Skipping.`);
        continue;
      }
      this.logger.log(`[BookingCom] Resolved destId for ${item.name} to ${destId}. Fetching hotels...`);
      const hotels = await this.searchHotels(destId, item.name, 1);
      
      // Normalize hotel data
      for (const h of hotels.slice(0, 50)) { // max 50 per city
        const property = h.property || h;
        if (!property?.name) continue;

        const photos = property.photoUrls || [];
        const reviewScore = property.reviewScore || property.reviewScoreWord;
        const priceBreakdown = h.priceBreakdown || {};
        const grossPrice = priceBreakdown.grossPrice?.value || priceBreakdown.grossPrice || 0;

        all.push({
          externalId: String(property.id || h.hotel_id || ''),
          name: property.name,
          description: `🏨 ${property.name} tại ${item.vi}, Việt Nam. ${property.reviewScoreWord || ''} - Đánh giá: ${reviewScore || 'Chưa có'}/10`,
          category: 'HOTEL',
          city: item.vi,
          address: `${item.vi}, Việt Nam`,
          latitude: property.latitude || 0,
          longitude: property.longitude || 0,
          priceMin: Math.round(grossPrice * 0.9),
          priceMax: Math.round(grossPrice * 1.5),
          priceRange: grossPrice > 0 ? `${Math.round(grossPrice).toLocaleString('vi-VN')}đ/đêm` : 'Liên hệ',
          avgRating: reviewScore ? Math.min(5, parseFloat(String(reviewScore)) / 2) : 4.0,
          amenities: this.extractAmenities(property),
          images: photos.slice(0, 3).length ? photos.slice(0, 3) : [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
          ],
          partnerPrice: Math.round(grossPrice || 1000000),
          partnerLink: `https://www.booking.com/hotel/vn/${property.id || ''}.vi.html`,
          source: 'BOOKING_COM_RAPIDAPI',
        });
      }
      // Wait 1.5s between cities to respect API rate limits (essential for free/basic keys)
      await this.sleep(1500);
    }
    return all;
  }

  private extractAmenities(property: any): string[] {
    const amenities: string[] = [];
    const raw = property.wishlistName || property.name || '';
    if (raw.toLowerCase().includes('resort')) amenities.push('Resort cao cấp');
    if (property.reviewScore >= 9) amenities.push('Đánh giá xuất sắc');
    if (property.isPreferred) amenities.push('Được ưa thích');
    amenities.push('Wifi miễn phí', 'Đặt phòng linh hoạt');
    return amenities.slice(0, 6);
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
