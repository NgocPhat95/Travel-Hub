import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.prisma.user.count();
    const totalPlaces = await this.prisma.place.count();
    const totalReviews = await this.prisma.review.count();
    const pendingClaims = await this.prisma.businessClaim.count({
      where: { status: 'PENDING' },
    });

    // Mock revenue: 25,000,000 VND base + 5,000 VND per affiliate click
    const clickCount = await this.prisma.affiliateClickLog.count();
    const estimatedRevenue = 25000000 + clickCount * 5000;

    return {
      totalUsers,
      totalPlaces,
      totalReviews,
      pendingClaims,
      estimatedRevenue,
    };
  }

  // Manage Places CRUD
  async getPlaces() {
    return this.prisma.place.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlace(data: any) {
    const place = await this.prisma.place.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        address: data.address,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        priceMin: data.priceMin ? parseFloat(data.priceMin) : null,
        priceMax: data.priceMax ? parseFloat(data.priceMax) : null,
        priceRange: data.priceRange || null,
        avgRating: 0,
        ratingAverage: 0,
        amenities: data.amenities || [],
        images: data.images || [],
        isVerified: data.isVerified ?? false,
        status: data.status || 'ACTIVE',
        avatarUrl: data.avatarUrl || null,
      },
    });

    await this.searchService.syncPlaceToElasticsearch(place.id);
    return place;
  }

  async updatePlace(id: string, data: any) {
    const place = await this.prisma.place.findUnique({ where: { id } });
    if (!place) {
      throw new NotFoundException('Không tìm thấy địa điểm.');
    }

    const updated = await this.prisma.place.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        address: data.address,
        latitude: data.latitude !== undefined ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude !== undefined ? parseFloat(data.longitude) : undefined,
        priceMin: data.priceMin !== undefined ? (data.priceMin ? parseFloat(data.priceMin) : null) : undefined,
        priceMax: data.priceMax !== undefined ? (data.priceMax ? parseFloat(data.priceMax) : null) : undefined,
        priceRange: data.priceRange,
        amenities: data.amenities,
        images: data.images,
        isVerified: data.isVerified,
        status: data.status,
        avatarUrl: data.avatarUrl,
      },
    });

    await this.searchService.syncPlaceToElasticsearch(updated.id);
    return updated;
  }

  async deletePlace(id: string) {
    const place = await this.prisma.place.findUnique({ where: { id } });
    if (!place) {
      throw new NotFoundException('Không tìm thấy địa điểm.');
    }

    await this.prisma.place.delete({ where: { id } });
    await this.searchService.deletePlaceFromElasticsearch(id);
    return { success: true };
  }

  // Edit Suggestions
  async getEditSuggestions() {
    return this.prisma.editSuggestion.findMany({
      include: {
        place: { select: { id: true, name: true, address: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveEditSuggestion(id: string) {
    const suggestion = await this.prisma.editSuggestion.findUnique({
      where: { id },
    });
    if (!suggestion) {
      throw new NotFoundException('Không tìm thấy đề xuất.');
    }

    const proposed = suggestion.proposedData as any;

    // Convert potential string inputs from JSON to correct float types if necessary
    const updateData: any = {};
    if (proposed.name !== undefined) updateData.name = proposed.name;
    if (proposed.description !== undefined) updateData.description = proposed.description;
    if (proposed.address !== undefined) updateData.address = proposed.address;
    if (proposed.latitude !== undefined) updateData.latitude = parseFloat(proposed.latitude);
    if (proposed.longitude !== undefined) updateData.longitude = parseFloat(proposed.longitude);
    if (proposed.priceMin !== undefined) updateData.priceMin = proposed.priceMin ? parseFloat(proposed.priceMin) : null;
    if (proposed.priceMax !== undefined) updateData.priceMax = proposed.priceMax ? parseFloat(proposed.priceMax) : null;
    if (proposed.priceRange !== undefined) updateData.priceRange = proposed.priceRange;
    if (proposed.amenities !== undefined) updateData.amenities = proposed.amenities;

    const updatedPlace = await this.prisma.place.update({
      where: { id: suggestion.placeId },
      data: updateData,
    });

    await this.prisma.editSuggestion.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    await this.searchService.syncPlaceToElasticsearch(suggestion.placeId);
    return { success: true, place: updatedPlace };
  }

  async rejectEditSuggestion(id: string) {
    const suggestion = await this.prisma.editSuggestion.findUnique({ where: { id } });
    if (!suggestion) {
      throw new NotFoundException('Không tìm thấy đề xuất.');
    }

    await this.prisma.editSuggestion.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    return { success: true };
  }

  // Content Moderation (Reported Reviews)
  async getReportedReviews() {
    // Return reports grouped by reviews
    return this.prisma.reviewReport.findMany({
      include: {
        review: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, status: true } },
            place: { select: { id: true, name: true } },
          },
        },
        reporter: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async keepReportedReview(reviewId: string) {
    // Delete all reports for this review
    await this.prisma.reviewReport.deleteMany({
      where: { reviewId },
    });
    return { success: true };
  }

  async hideReportedReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá.');
    }

    // Hide review
    await this.prisma.review.update({
      where: { id: reviewId },
      data: { isHidden: true },
    });

    // Recalculate average rating for the place
    const allReviews = await this.prisma.review.findMany({
      where: { placeId: review.placeId, isHidden: false },
      select: { ratingOverall: true },
    });

    const avg = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.ratingOverall, 0) / allReviews.length
      : 0;

    const roundedAvg = Math.round(avg * 10) / 10;

    await this.prisma.place.update({
      where: { id: review.placeId },
      data: {
        avgRating: roundedAvg,
        ratingAverage: roundedAvg,
      },
    });

    // Delete reports for it since it is now moderated/hidden
    await this.prisma.reviewReport.deleteMany({
      where: { reviewId },
    });

    await this.searchService.syncPlaceToElasticsearch(review.placeId);
    return { success: true };
  }

  async banUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    }

    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Không thể ban tài khoản quản trị viên cấp cao.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BANNED' },
    });

    return { success: true };
  }
}
