import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { PartnerName, BookingStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export interface PartnerPriceWithDeal {
  id: string;
  partnerName: PartnerName;
  price: number;
  currency: string;
  deepLink: string;
  isBestDeal: boolean;
}

@Injectable()
export class BookingService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  async onModuleInit() {
    try {
      console.log('[BookingService] Initializing Booking Partner Feeds...');
      const res = await this.syncBookingFeeds();
      console.log(`[BookingService] Booking Partner Feeds initialized. Synced ${res.count} deals.`);

      // Setup periodic real-time sync interval (every 30 minutes)
      const intervalMs = 30 * 60 * 1000;
      setInterval(async () => {
        try {
          console.log('[BookingService] Executing background periodic Booking.com feed sync...');
          const periodicRes = await this.syncBookingFeeds();
          console.log(`[BookingService] Background Booking.com feed sync complete. Synced ${periodicRes.count} deals.`);
        } catch (e: any) {
          console.error('[BookingService] Background Booking.com feed sync failed:', e.message);
        }
      }, intervalMs);

    } catch (e: any) {
      console.error('[BookingService] Failed to sync Booking Partner Feeds on startup:', e.message);
    }
  }

  async getPlacePrices(placeId: string): Promise<PartnerPriceWithDeal[]> {
    const prices = await this.prisma.partnerPrice.findMany({
      where: { placeId },
      orderBy: { price: 'asc' },
    });

    if (prices.length === 0) {
      return [];
    }

    // Lowest price is the first one because we ordered by price asc
    const lowestPrice = prices[0].price;

    return prices.map((item) => ({
      id: item.id,
      partnerName: item.partnerName,
      price: item.price,
      currency: item.currency,
      deepLink: item.deepLink,
      isBestDeal: item.price === lowestPrice,
    }));
  }

  async logAffiliateClick(
    placeId: string,
    partnerName: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<any> {
    // Validate partner enum
    const validPartner = PartnerName[partnerName as keyof typeof PartnerName];
    if (!validPartner) {
      throw new Error(`Invalid partner name: ${partnerName}`);
    }

    return this.prisma.affiliateClickLog.create({
      data: {
        placeId,
        partnerName: validPartner,
        userId: userId || null,
        ipAddress: ipAddress || null,
      },
    });
  }

  async getAffiliateLink(placeId: string, partnerName: string): Promise<string> {
    const validPartner = PartnerName[partnerName as keyof typeof PartnerName];
    if (!validPartner) {
      throw new Error(`Invalid partner name: ${partnerName}`);
    }

    const priceRecord = await this.prisma.partnerPrice.findFirst({
      where: { placeId, partnerName: validPartner },
      include: { place: true },
    });

    const place = priceRecord?.place || await this.prisma.place.findUnique({ where: { id: placeId } });

    // Nếu là Booking.com, chuyển hướng sang trang tìm kiếm chính xác theo tên địa điểm để tránh lỗi 404 (Không tìm thấy trang) do thay đổi slug URL
    if (validPartner === 'BOOKING_COM' && place) {
      return `https://www.booking.com/searchresults.vi.html?ss=${encodeURIComponent(place.name)}`;
    }

    // Nếu có deepLink hợp lệ từ TripAdvisor hoặc nguồn khác, dùng trực tiếp
    if (priceRecord?.deepLink && priceRecord.deepLink.startsWith('https://')) {
      return priceRecord.deepLink;
    }

    // Fallback: tìm bất kỳ partner nào cho place này
    const anyRecord = await this.prisma.partnerPrice.findFirst({
      where: { placeId },
      include: { place: true },
    });

    const fallbackPlace = (anyRecord as any)?.place || place;
    if (!fallbackPlace) {
      throw new NotFoundException('No link found for this place and partner.');
    }

    if (validPartner === 'BOOKING_COM') {
      return `https://www.booking.com/searchresults.vi.html?ss=${encodeURIComponent(fallbackPlace.name)}`;
    }

    // Generate TripAdvisor search URL as fallback
    const searchTerm = encodeURIComponent(fallbackPlace.name);
    const categoryMap: Record<string, string> = {
      HOTEL: 'Hotels',
      RESTAURANT: 'Restaurants',
      ATTRACTION: 'Attractions',
      TOUR: 'Attractions',
    };
    const category = categoryMap[fallbackPlace.category] || 'Hotels';
    return `https://www.tripadvisor.com.vn/Search?q=${searchTerm}&searchSessionId=tripadvisor&category=${category}`;
  }


  async syncBookingFeeds(): Promise<{ count: number }> {
    // 1. Get or create Booking.com Partner user
    let partnerUser = await this.prisma.user.findFirst({
      where: { email: 'booking-partner@travelhub.com' },
    });

    if (!partnerUser) {
      partnerUser = await this.prisma.user.create({
        data: {
          email: 'booking-partner@travelhub.com',
          fullName: 'Booking.com Partner',
          avatarUrl: 'https://logos-world.net/wp-content/uploads/2021/02/Booking-Logo-700x394.png',
          role: 'BUSINESS_OWNER',
          status: 'ACTIVE',
        },
      });
    }

    // 2. Load feed dynamically from URL or local file
    let deals: any[] = [];
    const feedUrl = process.env.BOOKING_COM_FEED_URL;
    
    if (feedUrl) {
      try {
        console.log(`[BookingService] Fetching Booking.com feed from remote URL: ${feedUrl}`);
        const response = await fetch(feedUrl);
        if (response.ok) {
          deals = await response.json() as any[];
          console.log(`[BookingService] Successfully loaded ${deals.length} deals from remote feed.`);
        } else {
          console.warn(`[BookingService] Remote feed fetch failed with status: ${response.status}`);
        }
      } catch (e: any) {
        console.warn(`[BookingService] Failed to fetch remote Booking.com feed: ${e.message}`);
      }
    }

    // Fallback to local file if remote load failed
    if (deals.length === 0) {
      try {
        const localPath = path.join(process.cwd(), 'booking_partner_feed.json');
        console.log(`[BookingService] Loading Booking.com feed from local file: ${localPath}`);
        if (fs.existsSync(localPath)) {
          const fileContent = fs.readFileSync(localPath, 'utf-8');
          deals = JSON.parse(fileContent);
          console.log(`[BookingService] Successfully loaded ${deals.length} deals from local file.`);
        } else {
          console.warn(`[BookingService] Local feed file not found at ${localPath}`);
        }
      } catch (e: any) {
        console.error(`[BookingService] Failed to load local Booking.com feed:`, e.message);
      }
    }

    if (deals.length === 0) {
      console.warn('[BookingService] No Booking.com deals loaded. Sync aborted.');
      return { count: 0 };
    }

    let count = 0;
    for (const deal of deals) {
      // Find or create place
      let place = await this.prisma.place.findFirst({
        where: { name: deal.name, category: deal.category },
      });

      if (!place) {
        place = await this.prisma.place.create({
          data: {
            name: deal.name,
            description: deal.description,
            category: deal.category,
            address: deal.address,
            latitude: deal.latitude,
            longitude: deal.longitude,
            priceMin: deal.priceMin,
            priceMax: deal.priceMax,
            priceRange: deal.priceRange,
            avgRating: deal.avgRating,
            ratingAverage: deal.avgRating,
            amenities: deal.amenities,
            images: deal.images,
            isVerified: true,
            status: 'ACTIVE',
          },
        });
      }

      // Upsert Partner Price for Booking.com
      const existingPrice = await this.prisma.partnerPrice.findFirst({
        where: { placeId: place.id, partnerName: 'BOOKING_COM' },
      });

      if (existingPrice) {
        await this.prisma.partnerPrice.update({
          where: { id: existingPrice.id },
          data: {
            price: deal.partnerPrice,
            deepLink: deal.partnerLink,
          },
        });
      } else {
        await this.prisma.partnerPrice.create({
          data: {
            placeId: place.id,
            partnerName: 'BOOKING_COM',
            price: deal.partnerPrice,
            currency: 'VND',
            deepLink: deal.partnerLink,
          },
        });
      }

      // Generate a Post on behalf of the partner if not already posted recently
      const existingPost = await this.prisma.post.findFirst({
        where: { userId: partnerUser.id, placeId: place.id },
      });

      if (!existingPost) {
        const post = await this.prisma.post.create({
          data: {
            userId: partnerUser.id,
            content: deal.postContent,
            placeId: place.id,
          },
        });

        // Add post image
        await this.prisma.postImage.create({
          data: {
            postId: post.id,
            url: deal.images[0],
          },
        });
      }

      // Sync to Elasticsearch in real-time
      try {
        await this.searchService.syncPlaceToElasticsearch(place.id);
      } catch (esError: any) {
        console.warn(`[BookingService] Failed to index place ${place.id} in Elasticsearch:`, esError.message);
      }

      count++;
    }

    return { count };
  }


  async createReservation(
    userId: string,
    dto: {
      placeId: string;
      checkIn: string;
      checkOut?: string;
      guestsCount: number;
      totalPrice?: number;
      specialRequests?: string;
    },
  ) {
    return this.prisma.booking.create({
      data: {
        userId,
        placeId: dto.placeId,
        checkIn: new Date(dto.checkIn),
        checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
        guestsCount: dto.guestsCount,
        totalPrice: dto.totalPrice || null,
        specialRequests: dto.specialRequests || null,
        status: BookingStatus.PENDING,
      },
      include: {
        place: {
          select: {
            id: true,
            name: true,
            address: true,
            category: true,
            images: true,
          },
        },
      },
    });
  }

  async getMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        place: {
          select: {
            id: true,
            name: true,
            address: true,
            category: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or you do not have permission to cancel it.');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
      include: {
        place: {
          select: {
            id: true,
            name: true,
            address: true,
            category: true,
            images: true,
          },
        },
      },
    });
  }
}
