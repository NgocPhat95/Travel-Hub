import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SearchService } from '../search/search.service';
import { CreateReviewDto } from './dto/review.dto';
import { MediaType } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly searchService: SearchService,
  ) {}

  async createReview(
    placeId: string,
    userId: string,
    dto: CreateReviewDto,
    files?: Express.Multer.File[],
  ) {
    // 1. Check if place exists
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
    });
    if (!place) {
      throw new NotFoundException('Không tìm thấy địa điểm du lịch.');
    }

    // 2. Create the review inside a transaction to ensure ratings are updated atomically
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          placeId,
          userId,
          ratingOverall: dto.ratingOverall,
          ratingCleanliness: dto.ratingCleanliness,
          ratingService: dto.ratingService,
          title: dto.title,
          content: dto.content,
          isPending: false, // development: bypass approval
        },
      });

      // 3. Process and upload media if files exist
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const mediaType = file.mimetype.startsWith('video/')
            ? MediaType.VIDEO
            : MediaType.IMAGE;
          const fileName = `review_${review.id}_${Date.now()}_${i}`;
          
          const uploadResult = await this.cloudinaryService.uploadReviewMedia(
            file.buffer,
            fileName,
            mediaType,
          );

          await tx.reviewMedia.create({
            data: {
              reviewId: review.id,
              url: uploadResult.secureUrl,
              type: mediaType,
            },
          });
        }
      }

      // 4. Re-calculate ratings for the place
      const reviews = await tx.review.findMany({
        where: { placeId, isPending: false },
        select: { ratingOverall: true },
      });

      const totalReviews = reviews.length;
      const sumRatings = reviews.reduce((sum, r) => sum + r.ratingOverall, 0);
      const avgRating = totalReviews > 0 ? sumRatings / totalReviews : 0;
      
      // Round to 1 decimal place
      const roundedAvg = Math.round(avgRating * 10) / 10;

      await tx.place.update({
        where: { id: placeId },
        data: {
          ratingAverage: roundedAvg,
          avgRating: roundedAvg,
        },
      });

      return review;
    }).then(async (review) => {
      // Sync place to Elasticsearch
      await this.searchService.syncPlaceToElasticsearch(placeId);

      // Return review with user and media
      return this.prisma.review.findUnique({
        where: { id: review.id },
        include: {
          media: true,
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              userLevel: true,
            },
          },
        },
      });
    });
  }

  async getReviews(
    placeId: string,
    query: { limit?: number; offset?: number; rating?: number },
    currentUserId?: string,
  ) {
    const limit = query.limit ? Number(query.limit) : 10;
    const offset = query.offset ? Number(query.offset) : 0;

    const where: any = {
      placeId,
      isPending: false,
    };

    if (query.rating) {
      where.ratingOverall = Number(query.rating);
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          media: true,
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              userLevel: true,
            },
          },
          _count: {
            select: { likes: true },
          },
          likes: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { userId: true },
              }
            : false,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.review.count({ where }),
    ]);

    // Map output to include likesCount and isLiked
    const mappedReviews = reviews.map((r) => {
      const { likes, _count, ...rest } = r;
      return {
        ...rest,
        likesCount: _count.likes,
        isLiked: currentUserId ? likes.length > 0 : false,
      };
    });

    return {
      reviews: mappedReviews,
      total,
      limit,
      offset,
    };
  }

  async getReviewStats(placeId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { placeId, isPending: false },
      select: {
        ratingOverall: true,
        ratingCleanliness: true,
        ratingService: true,
      },
    });

    const totalCount = reviews.length;
    if (totalCount === 0) {
      return {
        totalCount: 0,
        avgOverall: 0,
        avgCleanliness: 0,
        avgService: 0,
        distribution: {
          5: { count: 0, percentage: 0 },
          4: { count: 0, percentage: 0 },
          3: { count: 0, percentage: 0 },
          2: { count: 0, percentage: 0 },
          1: { count: 0, percentage: 0 },
        },
      };
    }

    let sumOverall = 0;
    let sumCleanliness = 0;
    let sumService = 0;

    const distributionCounts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((r) => {
      sumOverall += r.ratingOverall;
      sumCleanliness += r.ratingCleanliness;
      sumService += r.ratingService;

      // Group rating overall to nearest integer for distribution (normally overall rating is integer 1 to 5)
      const roundedRating = Math.round(r.ratingOverall) as 1 | 2 | 3 | 4 | 5;
      if (distributionCounts[roundedRating] !== undefined) {
        distributionCounts[roundedRating]++;
      }
    });

    const avgOverall = Math.round((sumOverall / totalCount) * 10) / 10;
    const avgCleanliness = Math.round((sumCleanliness / totalCount) * 10) / 10;
    const avgService = Math.round((sumService / totalCount) * 10) / 10;

    const distribution = {};
    [5, 4, 3, 2, 1].forEach((star) => {
      const count = distributionCounts[star as 1 | 2 | 3 | 4 | 5];
      const percentage = Math.round((count / totalCount) * 100);
      distribution[star] = { count, percentage };
    });

    return {
      totalCount,
      avgOverall,
      avgCleanliness,
      avgService,
      distribution,
    };
  }

  async likeReview(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá.');
    }

    // Create unique constraint or use upsert
    try {
      await this.prisma.reviewLike.create({
        data: {
          reviewId,
          userId,
        },
      });
    } catch (e) {
      // already liked, return success but don't fail
    }

    const likesCount = await this.prisma.reviewLike.count({
      where: { reviewId },
    });

    return { liked: true, likesCount };
  }

  async unlikeReview(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá.');
    }

    try {
      await this.prisma.reviewLike.delete({
        where: {
          reviewId_userId: {
            reviewId,
            userId,
          },
        },
      });
    } catch (e) {
      // not liked, return success but don't fail
    }

    const likesCount = await this.prisma.reviewLike.count({
      where: { reviewId },
    });

    return { liked: false, likesCount };
  }
}
