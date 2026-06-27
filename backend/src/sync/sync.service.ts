import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { VietnamDataService } from './providers/vietnam-data.service';
import { TripAdvisorRapidService } from './providers/tripadvisor-rapid.service';
import { BookingComRapidService } from './providers/booking-com-rapid.service';

export interface SyncResult {
  source: string;
  newItems: number;
  updatedItems: number;
  errors: number;
  startedAt: Date;
  completedAt: Date;
}

export interface SyncStatus {
  lastSyncAt: Date | null;
  isRunning: boolean;
  totalSynced: number;
  results: SyncResult[];
}

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);
  private isRunning = false;
  private lastSyncAt: Date | null = null;
  private totalSynced = 0;
  private lastResults: SyncResult[] = [];
  private readonly PARTNER_USER_EMAIL = 'tripadvisor-sync@travelhub.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly vietnamDataService: VietnamDataService,
    public readonly tripAdvisorService: TripAdvisorRapidService,
    public readonly bookingComService: BookingComRapidService,
  ) {}

  /**
   * Cron: tự động sync mỗi 6 giờ
   */
  @Cron('0 */6 * * *')
  async scheduledSync() {
    this.logger.log('[DataSync] ⏰ Scheduled sync triggered (every 6h)');
    await this.runFullSync();
  }

  async runFullSync(): Promise<SyncResult[]> {
    if (this.isRunning) {
      this.logger.warn('[DataSync] Already running, skipping.');
      return this.lastResults;
    }

    this.isRunning = true;
    this.lastResults = [];
    const t0 = Date.now();
    this.logger.log('[DataSync] === Full Sync Started (TripAdvisor & Booking.com RapidAPI) ===');

    try {
      await this.ensurePartnerUser();

      const hasApiKey = !!process.env.RAPIDAPI_KEY;
      if (hasApiKey) {
        this.logger.log('[DataSync] RapidAPI Key detected. Running real-time sync via Booking.com & TripAdvisor APIs...');
      } else {
        this.logger.log('[DataSync] No RapidAPI Key detected. Using local fallback datasets.');
      }

      // 1. Khách sạn Việt Nam (Lấy từ Booking.com API)
      const hotels = await this.syncSource(
        '🏨 Vietnam Hotels',
        async () => {
          let items: any[] = [];
          if (hasApiKey) {
            try {
              items = await this.bookingComService.fetchAllVietnamHotels();
            } catch (e: any) {
              this.logger.error(`Booking.com API failed: ${e.message}`);
            }
          }
          if (!items || items.length === 0) {
            this.logger.log('[DataSync] Falling back to local hotels dataset.');
            items = this.vietnamDataService.getHotels();
          }
          return items;
        },
      );
      this.lastResults.push(hotels);

      // 2. Nhà hàng Việt Nam
      const restaurants = await this.syncSource(
        '🍜 Vietnam Restaurants',
        async () => {
          let items: any[] = [];
          if (hasApiKey) {
            try {
              items = await this.tripAdvisorService.fetchAllVietnamRestaurants();
            } catch (e: any) {
              this.logger.error(`TripAdvisor restaurants API failed: ${e.message}`);
            }
          }
          if (!items || items.length === 0) {
            this.logger.log('[DataSync] Falling back to local restaurants dataset.');
            items = this.vietnamDataService.getRestaurants();
          }
          return items;
        },
      );
      this.lastResults.push(restaurants);

      // 3. Điểm tham quan & Tour
      const attractions = await this.syncSource(
        '🗺️ Vietnam Attractions & Tours',
        async () => {
          let items: any[] = [];
          if (hasApiKey) {
            try {
              items = await this.tripAdvisorService.fetchAllVietnamAttractions();
            } catch (e: any) {
              this.logger.error(`TripAdvisor attractions API failed: ${e.message}`);
            }
          }
          if (!items || items.length === 0) {
            this.logger.log('[DataSync] Falling back to local attractions dataset.');
            items = this.vietnamDataService.getAttractions();
          }
          return items;
        },
      );
      this.lastResults.push(attractions);

      // 4. Vé máy bay nội địa
      const flights = await this.syncSource(
        '✈️ Vietnam Flights',
        () => Promise.resolve(this.vietnamDataService.getFlights()),
      );
      this.lastResults.push(flights);

      // 5. Nạp dữ liệu Booking.com Premium Feed (Có nhiều nhà hàng, khách sạn, tour du lịch chất lượng cao)
      const bookingFeed = await this.syncSource(
        '📦 Booking.com Premium Feed',
        () => {
          try {
            const feedPath = path.join(process.cwd(), 'booking_partner_feed.json');
            if (fs.existsSync(feedPath)) {
              const content = fs.readFileSync(feedPath, 'utf8');
              const items = JSON.parse(content);
              return Promise.resolve(items.map((it: any) => ({
                ...it,
                partnerName: 'BOOKING_COM',
              })));
            }
          } catch (e: any) {
            this.logger.error(`Failed to load booking_partner_feed.json: ${e.message}`);
          }
          return Promise.resolve([]);
        }
      );
      this.lastResults.push(bookingFeed);

      this.lastSyncAt = new Date();
      this.totalSynced = this.lastResults.reduce((s, r) => s + r.newItems + r.updatedItems, 0);
      const elapsed = Math.round((Date.now() - t0) / 1000);
      this.logger.log(`[DataSync] ✅ Completed in ${elapsed}s | Total: ${this.totalSynced} items`);
    } catch (err: any) {
      this.logger.error(`[DataSync] ❌ Error: ${err.message}`);
    } finally {
      this.isRunning = false;
    }

    return this.lastResults;
  }

  private async syncSource(sourceName: string, fetchFn: () => Promise<any[]>): Promise<SyncResult> {
    const startedAt = new Date();
    let newItems = 0;
    let updatedItems = 0;
    let errors = 0;

    this.logger.log(`[DataSync] Syncing: ${sourceName}`);

    try {
      const items = await fetchFn();
      this.logger.log(`[DataSync] Got ${items.length} items from ${sourceName}`);

      const partnerUser = await this.prisma.user.findFirst({
        where: { email: this.PARTNER_USER_EMAIL },
      });

      for (const item of items) {
        try {
          const isNew = await this.upsertPlace(item, partnerUser?.id);
          if (isNew) newItems++;
          else updatedItems++;
        } catch (e: any) {
          this.logger.warn(`[DataSync] Upsert failed "${item?.name}": ${e.message}`);
          errors++;
        }
      }
    } catch (err: any) {
      this.logger.error(`[DataSync] Source "${sourceName}" failed: ${err.message}`);
      errors++;
    }

    const completedAt = new Date();
    this.logger.log(`[DataSync] ${sourceName}: +${newItems} new, ~${updatedItems} updated, ${errors} err`);
    return { source: sourceName, newItems, updatedItems, errors, startedAt, completedAt };
  }

  private async upsertPlace(item: any, partnerUserId?: string): Promise<boolean> {
    if (!item?.name || !item?.category) return false;

    const validCategories = ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'TOUR'];
    const category = validCategories.includes(item.category) ? item.category : 'ATTRACTION';

    let isNew = false;
    let place = await this.prisma.place.findFirst({
      where: { name: item.name, category },
    });

    if (!place) {
      isNew = true;
      place = await this.prisma.place.create({
        data: {
          name: item.name,
          description: item.description || `${item.name} tại ${item.city || 'Việt Nam'}`,
          category,
          address: item.address || `${item.city}, Việt Nam`,
          latitude: item.latitude || 0,
          longitude: item.longitude || 0,
          priceMin: item.priceMin || 0,
          priceMax: item.priceMax || 0,
          priceRange: item.priceRange || 'Liên hệ',
          avgRating: item.avgRating || 4.0,
          ratingAverage: item.avgRating || 4.0,
          amenities: item.amenities || [],
          images: item.images || [],
          isVerified: true,
          status: 'ACTIVE',
        },
      });
    } else {
      // Update with fresh data
      await this.prisma.place.update({
        where: { id: place.id },
        data: {
          priceMin: item.priceMin || place.priceMin,
          priceMax: item.priceMax || place.priceMax,
          priceRange: item.priceRange || place.priceRange,
          avgRating: item.avgRating || place.avgRating,
          images: item.images?.length ? item.images : place.images,
          amenities: item.amenities?.length ? item.amenities : place.amenities,
        },
      });
    }

    // Upsert PartnerPrice với TRIPADVISOR
    if (item.partnerLink) {
      const partnerName = item.partnerName === 'TRIPADVISOR' ? 'TRIPADVISOR' : 'BOOKING_COM';
      const existing = await this.prisma.partnerPrice.findFirst({
        where: { placeId: place.id, partnerName: partnerName as any },
      });

      if (existing) {
        await this.prisma.partnerPrice.update({
          where: { id: existing.id },
          data: { price: item.partnerPrice || 0, deepLink: item.partnerLink },
        });
      } else {
        await this.prisma.partnerPrice.create({
          data: {
            placeId: place.id,
            partnerName: partnerName as any,
            price: item.partnerPrice || 0,
            currency: 'VND',
            deepLink: item.partnerLink,
          },
        });
      }
    }

    // Tạo bài đăng xã hội nếu chưa có
    if (partnerUserId && isNew && item.images?.[0]) {
      try {
        const post = await this.prisma.post.create({
          data: {
            userId: partnerUserId,
            content: this.buildPostContent(item),
            placeId: place.id,
          },
        });
        await this.prisma.postImage.create({
          data: { postId: post.id, url: item.images[0] },
        });
      } catch {
        // Non-critical
      }
    }

    // Index Elasticsearch
    try {
      await this.searchService.syncPlaceToElasticsearch(place.id);
    } catch {
      // Non-critical
    }

    return isNew;
  }

  private buildPostContent(item: any): string {
    const icons: Record<string, string> = {
      HOTEL: '🏨', RESTAURANT: '🍜', ATTRACTION: '🗺️', TOUR: '✈️',
    };
    const icon = icons[item.category] || '📍';
    const desc = item.description?.slice(0, 120) || '';
    return `${icon} ${item.name} — ${item.city || 'Việt Nam'}\n${desc}\n#TravelHub #${item.category?.toLowerCase()} #${(item.city || '').replace(/\s/g, '')}`;
  }

  private async ensurePartnerUser(): Promise<void> {
    const exists = await this.prisma.user.findFirst({
      where: { email: this.PARTNER_USER_EMAIL },
    });
    if (!exists) {
      await this.prisma.user.create({
        data: {
          email: this.PARTNER_USER_EMAIL,
          fullName: 'TripAdvisor Data Feed',
          avatarUrl: 'https://static.tacdn.com/img2/brand_refresh/Tripadvisor_lockup_horizontal_secondary_registered.svg',
          role: 'BUSINESS_OWNER',
          status: 'ACTIVE',
        },
      });
    }
  }

  getStatus(): SyncStatus {
    return {
      lastSyncAt: this.lastSyncAt,
      isRunning: this.isRunning,
      totalSynced: this.totalSynced,
      results: this.lastResults,
    };
  }

  async scrapeImages(query: string = 'Vietnam'): Promise<string[]> {
    try {
      const url = 'https://www.booking.com/searchresults.vi.html';
      const response = await this.bookingComService['httpService'].axiosRef.get(url, {
        params: { ss: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'vi,en-US;q=0.7,en;q=0.3',
        }
      });

      const html = response.data;
      const regex = /https:\/\/cf\.bstatic\.com\/xdata\/images\/hotel\/[^\s"'>]+/g;
      const matches = html.match(regex) || [];
      const unique = [...new Set(matches)].map((link: string) => {
        // Clean up HTML entities if any
        return link.replace(/&amp;/g, '&');
      });

      this.logger.log(`[Scraper] Found ${unique.length} unique Booking.com images for query "${query}"`);
      return unique;
    } catch (e: any) {
      this.logger.error(`[Scraper] Failed to scrape Booking.com images: ${e.message}`);
      return [];
    }
  }
}

