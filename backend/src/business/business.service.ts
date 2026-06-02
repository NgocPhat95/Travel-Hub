import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ClaimStatus } from '@prisma/client';

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async createClaim(
    userId: string,
    placeId: string,
    file: Express.Multer.File,
  ): Promise<any> {
    const place = await this.prisma.place.findUnique({ where: { id: placeId } });
    if (!place) {
      throw new NotFoundException('Place not found.');
    }

    if (place.ownerId) {
      throw new BadRequestException('This place is already owned by a business.');
    }

    // 1. Upload certification document
    const fileName = `claim_${userId}_${placeId}_${Date.now()}`;
    const uploadResult = await this.cloudinary.uploadClaimDocument(file.buffer, fileName);

    // 2. Create the claim record
    // For local testing purposes, we automatically APPROVE claims
    // so B2B features are immediately unlockable for the user!
    const claim = await this.prisma.businessClaim.create({
      data: {
        userId,
        placeId,
        documentUrl: uploadResult.secureUrl,
        status: ClaimStatus.APPROVED, // Auto-approve for testing
      },
    });

    // 3. Assign ownership of the place to user
    await this.prisma.place.update({
      where: { id: placeId },
      data: {
        ownerId: userId,
        isVerified: true,
      },
    });

    return claim;
  }

  async getOwnedPlaces(userId: string): Promise<any[]> {
    return this.prisma.place.findMany({
      where: { ownerId: userId },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
            businessResponse: true,
          },
        },
      },
    });
  }

  async respondToReview(
    userId: string,
    reviewId: string,
    content: string,
  ): Promise<any> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { place: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    if (review.place.ownerId !== userId) {
      throw new ForbiddenException('You do not own this place listing.');
    }

    // Create or update management response
    return this.prisma.businessResponse.upsert({
      where: { reviewId },
      create: {
        reviewId,
        userId,
        content,
      },
      update: {
        content,
      },
    });
  }

  async getAnalytics(placeId: string, userId: string): Promise<any[]> {
    const place = await this.prisma.place.findUnique({ where: { id: placeId } });
    if (!place) {
      throw new NotFoundException('Place not found.');
    }

    if (place.ownerId !== userId) {
      throw new ForbiddenException('You do not own this place listing.');
    }

    const redis = this.redisService.getClient();
    const stats: any[] = [];

    // Calculate B2B analytics for the last 6 months (chronological)
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth(); // 0-indexed

      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const displayLabel = `Tháng ${month + 1}/${year.toString().slice(-2)}`;

      // 1. Fetch Unique Views from Redis Set
      const viewsKey = `place:views:${placeId}:${monthKey}`;
      const viewsCount = await redis.scard(viewsKey);

      // 2. Fetch Affiliate Clicks
      const clicksCount = await this.prisma.affiliateClickLog.count({
        where: {
          placeId,
          clickedAt: {
            gte: new Date(year, month, 1),
            lt: new Date(year, month + 1, 1),
          },
        },
      });

      // 3. Fetch Reviews
      const reviewsCount = await this.prisma.review.count({
        where: {
          placeId,
          createdAt: {
            gte: new Date(year, month, 1),
            lt: new Date(year, month + 1, 1),
          },
        },
      });

      stats.push({
        month: displayLabel,
        views: viewsCount,
        clicks: clicksCount,
        reviews: reviewsCount,
      });
    }

    return stats;
  }
}
