import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto, AddTripItemDto, ReorderTripItemsDto, AddCollaboratorDto } from './dto/trip.dto';
import { CollaboratorRole } from '@prisma/client';

@Injectable()
export class TripService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkEditPermission(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { collaborators: true },
    });

    if (!trip) {
      throw new NotFoundException('Không tìm thấy chuyến đi.');
    }

    if (trip.ownerId === userId) {
      return true;
    }

    const collaborator = trip.collaborators.find((c) => c.userId === userId);
    if (collaborator && collaborator.role === CollaboratorRole.EDITOR) {
      return true;
    }

    throw new ForbiddenException('Bạn không có quyền chỉnh sửa hành trình này.');
  }

  async createTrip(ownerId: string, dto: CreateTripDto) {
    return this.prisma.trip.create({
      data: {
        title: dto.title,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        ownerId,
      },
    });
  }

  async getTrips(userId: string) {
    return this.prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        items: {
          take: 1,
          include: {
            place: {
              select: {
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTripDetail(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            email: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        items: {
          include: {
            place: true,
          },
          orderBy: [
            { dayNumber: 'asc' },
            { sequenceOrder: 'asc' },
          ],
        },
      },
    });

    if (!trip) {
      throw new NotFoundException('Không tìm thấy chuyến đi.');
    }

    const isOwner = trip.ownerId === userId;
    const isCollaborator = trip.collaborators.some((c) => c.userId === userId);

    if (!isOwner && !isCollaborator) {
      throw new ForbiddenException('Bạn không có quyền truy cập chuyến đi này.');
    }

    return trip;
  }

  async deleteTrip(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException('Không tìm thấy chuyến đi.');
    }

    if (trip.ownerId !== userId) {
      throw new ForbiddenException('Chỉ có chủ sở hữu mới có quyền xóa chuyến đi này.');
    }

    await this.prisma.trip.delete({
      where: { id: tripId },
    });

    return { success: true };
  }

  async updateTrip(tripId: string, userId: string, dto: CreateTripDto) {
    await this.checkEditPermission(tripId, userId);
    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        title: dto.title,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async addTripItem(tripId: string, userId: string, dto: AddTripItemDto) {
    await this.checkEditPermission(tripId, userId);

    return this.prisma.tripItem.create({
      data: {
        tripId,
        placeId: dto.placeId,
        dayNumber: dto.dayNumber,
        sequenceOrder: dto.sequenceOrder,
        note: dto.note,
      },
      include: {
        place: true,
      },
    });
  }

  async deleteTripItem(tripId: string, itemId: string, userId: string) {
    await this.checkEditPermission(tripId, userId);

    const item = await this.prisma.tripItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.tripId !== tripId) {
      throw new NotFoundException('Không tìm thấy địa điểm trong chuyến đi.');
    }

    await this.prisma.tripItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  }

  async reorderTripItems(tripId: string, userId: string, dto: ReorderTripItemsDto) {
    await this.checkEditPermission(tripId, userId);

    // Update all sequence orders inside a transaction to maintain integrity
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.tripItem.update({
          where: { id: item.id },
          data: {
            dayNumber: item.dayNumber,
            sequenceOrder: item.sequenceOrder,
          },
        })
      )
    );

    return { success: true };
  }

  async addCollaborator(tripId: string, ownerId: string, dto: AddCollaboratorDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException('Không tìm thấy chuyến đi.');
    }

    if (trip.ownerId !== ownerId) {
      throw new ForbiddenException('Chỉ chủ chuyến đi mới được thêm cộng tác viên.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng với email này.');
    }

    if (targetUser.id === ownerId) {
      throw new ForbiddenException('Bạn là chủ chuyến đi, không thể tự thêm chính mình.');
    }

    try {
      return await this.prisma.tripCollaborator.create({
        data: {
          tripId,
          userId: targetUser.id,
          role: dto.role,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              email: true,
            },
          },
        },
      });
    } catch (e) {
      throw new ForbiddenException('Người dùng này đã tham gia chuyến đi.');
    }
  }

  async removeCollaborator(tripId: string, ownerId: string, collaboratorUserId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException('Không tìm thấy chuyến đi.');
    }

    if (trip.ownerId !== ownerId) {
      throw new ForbiddenException('Chỉ chủ chuyến đi mới được xóa cộng tác viên.');
    }

    await this.prisma.tripCollaborator.delete({
      where: {
        tripId_userId: {
          tripId,
          userId: collaboratorUserId,
        },
      },
    });

    return { success: true };
  }
}
