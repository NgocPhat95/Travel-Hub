import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        coverUrl: true,
        role: true,
        status: true,
        userLevel: true,
        experiencePoints: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async updateMe(
    userId: string,
    dto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
    coverFile?: Express.Multer.File,
  ) {
    const data: {
      fullName?: string;
      bio?: string | null;
      avatarUrl?: string | null;
      coverUrl?: string | null;
    } = {};

    if (dto.fullName) {
      data.fullName = dto.fullName;
    }

    if (dto.bio !== undefined) {
      data.bio = dto.bio;
    }

    if (avatarFile) {
      const uploadResult = await this.cloudinaryService.uploadAvatar(
        avatarFile.buffer,
        `${userId}-${Date.now()}`,
      );
      data.avatarUrl = uploadResult.secureUrl;
    }

    if (coverFile) {
      const uploadResult = await this.cloudinaryService.uploadCover(
        coverFile.buffer,
        `${userId}-${Date.now()}`,
      );
      data.coverUrl = uploadResult.secureUrl;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        coverUrl: true,
        role: true,
        status: true,
        userLevel: true,
        experiencePoints: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        userLevel: true,
        experiencePoints: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }
}
