import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerName } from '@prisma/client';

export interface PartnerPriceWithDeal {
  id: string;
  partnerName: PartnerName;
  price: number;
  currency: string;
  deepLink: string;
  isBestDeal: boolean;
}

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

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
    });

    if (!priceRecord) {
      throw new NotFoundException('No link found for this place and partner.');
    }

    const affiliateId = 'TRAVEL_HUB_2026';
    const separator = priceRecord.deepLink.includes('?') ? '&' : '?';
    return `${priceRecord.deepLink}${separator}affiliateId=${affiliateId}`;
  }
}
