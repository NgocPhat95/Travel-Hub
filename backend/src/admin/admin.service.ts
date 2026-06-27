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
    const [totalUsers, totalPlaces, totalReviews, pendingClaims, clickCount, totalReports, bannedUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.place.count(),
        this.prisma.review.count(),
        this.prisma.businessClaim.count({ where: { status: 'PENDING' } }),
        this.prisma.affiliateClickLog.count(),
        this.prisma.reviewReport.count(),
        this.prisma.user.count({ where: { status: 'BANNED' } }),
      ]);

    return {
      totalUsers,
      totalPlaces,
      totalReviews,
      pendingClaims,
      estimatedRevenue: 25000000 + clickCount * 5000,
      totalReports,
      bannedUsers,
      pendingReports: totalReports,
    };
  }

  // ======================= QUẢN LÝ NGƯỜI DÙNG =======================

  async getAllUsers(page = 1, limit = 20, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      NOT: { email: { contains: 'travelhub.local' } },
    };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          status: true,
          userLevel: true,
          createdAt: true,
          _count: { select: { reviews: true, posts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const usersWithViolations = await Promise.all(
      users.map(async (u) => {
        const [reportCount, warningCount] = await Promise.all([
          this.prisma.reviewReport.count({ where: { review: { userId: u.id } } }),
          this.prisma.adminWarning.count({ where: { userId: u.id } }),
        ]);
        return { ...u, reportCount, warningCount };
      }),
    );

    return { users: usersWithViolations, total, page, limit };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        status: true,
        userLevel: true,
        bio: true,
        createdAt: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            place: { select: { id: true, name: true } },
            reports: { select: { id: true, reason: true } },
          },
        },
        posts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            images: { select: { url: true } },
            place: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');

    const warnings = await this.prisma.adminWarning.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return { ...user, warnings };
  }

  // ======================= THÔNG BÁO VI PHẠM =======================

  async getViolationNotifications() {
    const reportedReviews = await this.prisma.reviewReport.findMany({
      include: {
        review: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, email: true, status: true } },
            place: { select: { id: true, name: true } },
          },
        },
        reporter: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const grouped: Record<string, any> = {};
    for (const r of reportedReviews) {
      const rid = r.reviewId;
      if (!grouped[rid]) {
        grouped[rid] = {
          reviewId: rid,
          review: r.review,
          reports: [],
          reportCount: 0,
          violationType: this.detectViolationType(r.review?.content || '', r.reason),
        };
      }
      grouped[rid].reports.push({ reason: r.reason, reporter: r.reporter, createdAt: r.createdAt });
      grouped[rid].reportCount++;
    }

    return Object.values(grouped).sort((a: any, b: any) => b.reportCount - a.reportCount);
  }

  private detectViolationType(content: string, reason: string): string {
    const lower = (content + ' ' + reason).toLowerCase();
    if (lower.includes('ảnh') || lower.includes('hình') || lower.includes('sensitive') || lower.includes('nude')) {
      return 'SENSITIVE_IMAGE';
    }
    if (lower.includes('spam') || lower.includes('quảng cáo')) {
      return 'SPAM';
    }
    if (lower.includes('chửi') || lower.includes('tục') || lower.includes('offensive') || lower.includes('hate')) {
      return 'OFFENSIVE_LANGUAGE';
    }
    return 'NEGATIVE_CONTENT';
  }

  // ======================= GỬI CẢNH BÁO =======================

  async sendWarning(userId: string, message: string, severity: 'LOW' | 'MEDIUM' | 'HIGH') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Không thể gửi cảnh báo đến quản trị viên.');
    }

    const warning = await this.prisma.adminWarning.create({
      data: { userId, message, severity },
    });

    const highWarnings = await this.prisma.adminWarning.count({
      where: { userId, severity: 'HIGH' },
    });

    let autoBanned = false;
    if (highWarnings >= 3) {
      await this.prisma.user.update({ where: { id: userId }, data: { status: 'BANNED' } });
      autoBanned = true;
    }

    return {
      success: true,
      warning,
      autoBanned,
      message: autoBanned
        ? `Đã gửi cảnh báo và tự động khóa tài khoản (vi phạm nghiêm trọng lần ${highWarnings}).`
        : `Đã gửi cảnh báo mức ${severity} đến người dùng.`,
    };
  }

  // ======================= XÓA NỘI DUNG VI PHẠM =======================

  async deleteViolatingPost(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng.');
    await this.prisma.postImage.deleteMany({ where: { postId } });
    await this.prisma.postComment.deleteMany({ where: { postId } });
    await this.prisma.postLike.deleteMany({ where: { postId } });
    await this.prisma.post.delete({ where: { id: postId } });
    return { success: true, message: 'Đã xóa bài đăng vi phạm.' };
  }

  async deleteViolatingComment(commentId: string) {
    const comment = await this.prisma.postComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận.');
    await this.prisma.postComment.delete({ where: { id: commentId } });
    return { success: true, message: 'Đã xóa bình luận vi phạm.' };
  }

  // ======================= QUẢN LÝ TÀI KHOẢN =======================

  async banUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Không thể khóa tài khoản quản trị viên cấp cao.');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'BANNED' } });
    return { success: true, message: 'Đã khóa tài khoản người dùng.' };
  }

  async unbanUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    return { success: true, message: 'Đã mở khóa tài khoản người dùng.' };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Không thể xóa tài khoản quản trị viên cấp cao.');
    }

    await this.prisma.postComment.deleteMany({ where: { userId } });
    await this.prisma.postLike.deleteMany({ where: { userId } });
    const posts = await this.prisma.post.findMany({ where: { userId }, select: { id: true } });
    for (const p of posts) {
      await this.prisma.postImage.deleteMany({ where: { postId: p.id } });
      await this.prisma.postComment.deleteMany({ where: { postId: p.id } });
      await this.prisma.postLike.deleteMany({ where: { postId: p.id } });
    }
    await this.prisma.post.deleteMany({ where: { userId } });
    await this.prisma.reviewLike.deleteMany({ where: { userId } });
    await this.prisma.reviewReport.deleteMany({ where: { reporterId: userId } });
    await this.prisma.review.deleteMany({ where: { userId } });
    await this.prisma.adminWarning.deleteMany({ where: { userId } });
    await this.prisma.user.delete({ where: { id: userId } });

    return { success: true, message: 'Đã xóa vĩnh viễn tài khoản người dùng.' };
  }

  // ======================= NỘI DUNG KIỂM DUYỆT =======================

  async getPlaces() {
    return this.prisma.place.findMany({ orderBy: { createdAt: 'desc' } });
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
    if (!place) throw new NotFoundException('Không tìm thấy địa điểm.');
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
    if (!place) throw new NotFoundException('Không tìm thấy địa điểm.');
    await this.prisma.place.delete({ where: { id } });
    await this.searchService.deletePlaceFromElasticsearch(id);
    return { success: true };
  }

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
    const suggestion = await this.prisma.editSuggestion.findUnique({ where: { id } });
    if (!suggestion) throw new NotFoundException('Không tìm thấy đề xuất.');
    const proposed = suggestion.proposedData as any;
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
    const updatedPlace = await this.prisma.place.update({ where: { id: suggestion.placeId }, data: updateData });
    await this.prisma.editSuggestion.update({ where: { id }, data: { status: 'APPROVED' } });
    await this.searchService.syncPlaceToElasticsearch(suggestion.placeId);
    return { success: true, place: updatedPlace };
  }

  async rejectEditSuggestion(id: string) {
    const suggestion = await this.prisma.editSuggestion.findUnique({ where: { id } });
    if (!suggestion) throw new NotFoundException('Không tìm thấy đề xuất.');
    await this.prisma.editSuggestion.update({ where: { id }, data: { status: 'REJECTED' } });
    return { success: true };
  }

  async getReportedReviews() {
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
    await this.prisma.reviewReport.deleteMany({ where: { reviewId } });
    return { success: true };
  }

  async hideReportedReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá.');
    await this.prisma.review.update({ where: { id: reviewId }, data: { isHidden: true } });
    const allReviews = await this.prisma.review.findMany({
      where: { placeId: review.placeId, isHidden: false },
      select: { ratingOverall: true },
    });
    const avg = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.ratingOverall, 0) / allReviews.length
      : 0;
    await this.prisma.place.update({
      where: { id: review.placeId },
      data: { avgRating: Math.round(avg * 10) / 10, ratingAverage: Math.round(avg * 10) / 10 },
    });
    await this.prisma.reviewReport.deleteMany({ where: { reviewId } });
    await this.searchService.syncPlaceToElasticsearch(review.placeId);
    return { success: true };
  }
}
