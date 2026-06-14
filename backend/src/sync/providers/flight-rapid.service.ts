import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Sky-Scrapper Flight API via RapidAPI
 * Host: sky-scrapper.p.rapidapi.com
 * Lấy vé máy bay, tìm kiếm chuyến bay
 */
@Injectable()
export class FlightRapidService {
  private readonly logger = new Logger(FlightRapidService.name);
  private readonly rapidApiKey: string;
  private readonly host = 'sky-scrapper.p.rapidapi.com';
  private readonly baseUrl = `https://${this.host}`;

  // Các sân bay chính tại Việt Nam
  private readonly vietnamAirports = [
    { skyId: 'HAN', entityId: '27536509', city: 'Hà Nội', name: 'Sân bay Nội Bài (HAN)' },
    { skyId: 'SGN', entityId: '27536566', city: 'TP. Hồ Chí Minh', name: 'Sân bay Tân Sơn Nhất (SGN)' },
    { skyId: 'DAD', entityId: '27536487', city: 'Đà Nẵng', name: 'Sân bay Đà Nẵng (DAD)' },
    { skyId: 'PQC', entityId: '27536547', city: 'Phú Quốc', name: 'Sân bay Phú Quốc (PQC)' },
    { skyId: 'CXR', entityId: '27536480', city: 'Nha Trang', name: 'Sân bay Cam Ranh (CXR)' },
    { skyId: 'HUI', entityId: '27536504', city: 'Huế', name: 'Sân bay Phú Bài (HUI)' },
    { skyId: 'DLI', entityId: '27536488', city: 'Đà Lạt', name: 'Sân bay Liên Khương (DLI)' },
    { skyId: 'VCA', entityId: '27536574', city: 'Cần Thơ', name: 'Sân bay Cần Thơ (VCA)' },
  ];

  // Các route phổ biến
  private readonly popularRoutes = [
    { from: 'HAN', fromId: '27536509', to: 'SGN', toId: '27536566', label: 'Hà Nội → TP.HCM' },
    { from: 'SGN', fromId: '27536566', to: 'HAN', toId: '27536509', label: 'TP.HCM → Hà Nội' },
    { from: 'HAN', fromId: '27536509', to: 'DAD', toId: '27536487', label: 'Hà Nội → Đà Nẵng' },
    { from: 'SGN', fromId: '27536566', to: 'PQC', toId: '27536547', label: 'TP.HCM → Phú Quốc' },
    { from: 'HAN', fromId: '27536509', to: 'PQC', toId: '27536547', label: 'Hà Nội → Phú Quốc' },
    { from: 'SGN', fromId: '27536566', to: 'DAD', toId: '27536487', label: 'TP.HCM → Đà Nẵng' },
    { from: 'HAN', fromId: '27536509', to: 'CXR', toId: '27536480', label: 'Hà Nội → Nha Trang' },
    { from: 'SGN', fromId: '27536566', to: 'CXR', toId: '27536480', label: 'TP.HCM → Nha Trang' },
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

  /**
   * Search one-way flights between two airports
   */
  async searchFlights(
    fromSkyId: string,
    fromEntityId: string,
    toSkyId: string,
    toEntityId: string,
    date: string, // YYYY-MM-DD
  ): Promise<any[]> {
    if (!this.rapidApiKey) return [];
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/flights/searchFlights`, {
          headers: this.headers,
          params: {
            originSkyId: fromSkyId,
            destinationSkyId: toSkyId,
            originEntityId: fromEntityId,
            destinationEntityId: toEntityId,
            date,
            adults: '1',
            currency: 'VND',
            market: 'VN',
            locale: 'vi-VN',
            cabinClass: 'economy',
          },
        }),
      );
      return response.data?.data?.itineraries || [];
    } catch (err: any) {
      this.logger.error(`[Flight] Failed to search ${fromSkyId}→${toSkyId}: ${err.message}`);
      return [];
    }
  }

  /**
   * Fetch popular flight routes to display as "Vé máy bay phổ biến"
   */
  async fetchPopularFlightRoutes(): Promise<any[]> {
    const all: any[] = [];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14); // 2 tuần tới
    const dateStr = futureDate.toISOString().split('T')[0];

    for (const route of this.popularRoutes.slice(0, 4)) { // giới hạn 4 route để không vượt quota
      const itineraries = await this.searchFlights(
        route.from, route.fromId,
        route.to, route.toId,
        dateStr,
      );

      for (const it of itineraries.slice(0, 3)) {
        const leg = it.legs?.[0];
        if (!leg) continue;

        const price = it.price?.raw || it.price?.formatted || 0;
        const airline = leg.carriers?.marketing?.[0];

        all.push({
          externalId: `flight_${route.from}_${route.to}_${it.id || Math.random()}`,
          name: `${route.label} - ${airline?.name || 'Hàng không'}`,
          description: `Vé máy bay ${route.label}. Hãng: ${airline?.name || 'Chưa xác định'}. Thời gian bay: ${Math.round((leg.durationInMinutes || 120) / 60)}h${(leg.durationInMinutes || 120) % 60}m. Chặng bay trực tiếp.`,
          category: 'TOUR', // Dùng TOUR cho loại vé
          city: route.label.split(' → ')[0],
          address: `${route.from} → ${route.to}, Việt Nam`,
          latitude: 16.0,
          longitude: 108.0,
          priceMin: typeof price === 'number' ? Math.round(price * 0.9) : 800000,
          priceMax: typeof price === 'number' ? Math.round(price * 1.3) : 2000000,
          priceRange: `${typeof price === 'number' ? Math.round(price).toLocaleString('vi-VN') : '800.000'}đ`,
          avgRating: 4.5,
          amenities: ['Bay thẳng', 'Hành lý xách tay', 'Check-in online', airline?.name || 'Hàng không VN'],
          images: ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80'],
          partnerPrice: typeof price === 'number' ? Math.round(price) : 1200000,
          partnerLink: `https://www.booking.com/flights/searchresults?from_airport=${route.from}&to_airport=${route.to}&depart_date=${dateStr}&aid=2311236`,
          source: 'SKYSCRAPPER_RAPIDAPI',
          flightDetails: {
            from: route.from,
            to: route.to,
            airline: airline?.name,
            airlineCode: airline?.alternateId,
            duration: leg.durationInMinutes,
            stops: leg.stopCount || 0,
            date: dateStr,
          },
        });
      }
      await this.sleep(500);
    }
    return all;
  }

  getVietnamAirports() {
    return this.vietnamAirports;
  }

  getPopularRoutes() {
    return this.popularRoutes;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
