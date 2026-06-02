import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async addToWishlist(userId: string, placeId: string) {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
    });
    if (!place) {
      throw new NotFoundException('Không tìm thấy địa điểm du lịch.');
    }

    try {
      await this.prisma.wishlist.create({
        data: {
          userId,
          placeId,
        },
      });
    } catch (e) {
      // Already exists, ignore error and return success
    }

    return { success: true, saved: true };
  }

  async removeFromWishlist(userId: string, placeId: string) {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
    });
    if (!place) {
      throw new NotFoundException('Không tìm thấy địa điểm du lịch.');
    }

    try {
      await this.prisma.wishlist.delete({
        where: {
          userId_placeId: {
            userId,
            placeId,
          },
        },
      });
    } catch (e) {
      // Not in wishlist, ignore error and return success
    }

    return { success: true, saved: false };
  }

  async getWishlist(userId: string) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        place: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return items.map((item) => item.place);
  }

  async getWishlistStatus(userId: string, placeId: string) {
    const item = await this.prisma.wishlist.findUnique({
      where: {
        userId_placeId: {
          userId,
          placeId,
        },
      },
    });

    return { saved: !!item };
  }
}
