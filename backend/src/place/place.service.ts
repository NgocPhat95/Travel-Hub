import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GetPlacesDto } from './dto/place.dto';

@Injectable()
export class PlaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getPlaces(dto: GetPlacesDto) {
    const { limit, offset, category, sortBy } = dto;
    const where: any = { status: 'ACTIVE' };

    if (category) {
      where.category = category;
    }

    let orderBy: any = {};
    if (sortBy === 'rating') {
      orderBy = { ratingAverage: 'desc' };
    } else if (sortBy === 'name') {
      orderBy = { name: 'asc' };
    } else if (sortBy === 'popularity') {
      orderBy = {
        questions: {
          _count: 'desc',
        },
      };
    }

    const [places, total] = await Promise.all([
      this.prisma.place.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: { reviews: true },
          },
        },
      }),
      this.prisma.place.count({ where }),
    ]);

    const mappedPlaces = places.map((place) => {
      const { _count, ...rest } = place;
      return {
        ...rest,
        isTravelersChoice: place.ratingAverage >= 4.5 && _count.reviews >= 3,
      };
    });

    return {
      places: mappedPlaces,
      total,
      limit,
      offset,
    };
  }

  async getTravelersChoice(category?: string, limit = 25): Promise<any[]> {
    const where: any = { status: 'ACTIVE', ratingAverage: { gte: 4.0 } };
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const places = await this.prisma.place.findMany({
      where,
      orderBy: { ratingAverage: 'desc' },
      take: limit,
      include: {
        _count: { select: { reviews: true } },
        partnerPrices: {
          where: { partnerName: 'BOOKING_COM' },
          take: 1,
        },
      },
    });

    return places.map((place, index) => {
      const { _count, partnerPrices, ...rest } = place;
      const isBestOfBest = place.ratingAverage >= 4.8 && _count.reviews >= 3;
      return {
        ...rest,
        rank: index + 1,
        reviewCount: _count.reviews,
        isTravelersChoice: true,
        isBestOfBest,
        bookingPrice: partnerPrices.length > 0 ? partnerPrices[0].price : null,
        bookingLink: partnerPrices.length > 0 ? partnerPrices[0].deepLink : null,
      };
    });
  }

  async getPlaceDetail(id: string, clientIp?: string) {
    const place = await this.prisma.place.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!place) {
      throw new NotFoundException('Không tìm thấy địa điểm du lịch.');
    }

    if (clientIp) {
      try {
        const redis = this.redisService.getClient();
        const d = new Date();
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const viewsKey = `place:views:${id}:${monthKey}`;
        await redis.sadd(viewsKey, clientIp);
      } catch (e) {
        console.error('Failed to log unique IP view in Redis:', e.message);
      }
    }

    // Fetch traveler photos (ReviewMedia)
    const reviewsWithMedia = await this.prisma.review.findMany({
      where: {
        placeId: id,
        isPending: false,
        isHidden: false,
        media: {
          some: {},
        },
      },
      include: {
        media: {
          select: {
            url: true,
          },
        },
      },
    });
    const travelerPhotos = reviewsWithMedia.flatMap((r) => r.media.map((m) => m.url));

    const isTravelersChoice = place.ratingAverage >= 4.5 && place._count.reviews >= 3;
    const { _count, ...placeData } = place;

    const placeWithMeta = {
      ...placeData,
      isTravelersChoice,
      travelerPhotos,
    };

    // Sinh cấu trúc dữ liệu JSON-LD cho công cụ tìm kiếm (Google SEO)
    const jsonLdSchema = {
      '@context': 'https://schema.org',
      '@type': placeWithMeta.category === 'HOTEL' ? 'Hotel' : placeWithMeta.category === 'RESTAURANT' ? 'Restaurant' : 'TouristAttraction',
      'name': placeWithMeta.name,
      'description': placeWithMeta.description,
      'image': placeWithMeta.images && placeWithMeta.images.length > 0 ? placeWithMeta.images : [placeWithMeta.avatarUrl],
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': placeWithMeta.address,
        'addressLocality': placeWithMeta.address.split(',').pop()?.trim() || 'Việt Nam',
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': placeWithMeta.latitude,
        'longitude': placeWithMeta.longitude,
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': placeWithMeta.ratingAverage,
        'bestRating': '5',
        'worstRating': '1',
        'ratingCount': place._count.reviews || 10,
      },
    };

    return {
      place: placeWithMeta,
      seo: {
        title: `${placeWithMeta.name} - Đánh giá, Địa chỉ & Giá cả | Travel Hub`,
        metaDescription: placeWithMeta.description || `Xem chi tiết địa chỉ, hình ảnh, tiện nghi và điểm đánh giá của ${placeWithMeta.name} tại Travel Hub.`,
        jsonLdSchema,
      },
    };
  }

  async getPlaceQuestions(placeId: string) {
    const questions = await this.prisma.question.findMany({
      where: { placeId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        answers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return questions;
  }

  async createQuestion(placeId: string, userId: string, content: string) {
    // Kiểm tra xem địa điểm có tồn tại
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
    });
    if (!place) {
      throw new NotFoundException('Không tìm thấy địa điểm.');
    }

    return this.prisma.question.create({
      data: {
        placeId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        answers: true,
      },
    });
  }

  async createAnswer(questionId: string, userId: string, content: string) {
    // Kiểm tra câu hỏi có tồn tại
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi.');
    }

    return this.prisma.answer.create({
      data: {
        questionId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async suggestEdit(placeId: string, userId: string, proposedData: any) {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
    });
    if (!place) {
      throw new NotFoundException('Không tìm thấy địa điểm.');
    }

    return this.prisma.editSuggestion.create({
      data: {
        placeId,
        userId,
        proposedData,
        status: 'PENDING',
      },
    });
  }
}
