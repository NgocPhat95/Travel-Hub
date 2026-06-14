import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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

  async updateAccount(
    userId: string,
    dto: { email?: string; currentPassword?: string; newPassword?: string },
  ) {
    const data: { email?: string; passwordHash?: string } = {};

    if (dto.email) {
      const trimmedEmail = dto.email.trim().toLowerCase();
      const existingUser = await this.prisma.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email này đã được sử dụng bởi tài khoản khác.');
      }
      data.email = trimmedEmail;
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng.');
      }

      // Check if user has passwordHash (might be google auth user without password)
      if (user.passwordHash) {
        const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isMatch) {
          throw new BadRequestException('Mật khẩu hiện tại không chính xác.');
        }
      }

      // Hash new password
      data.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    return this.prisma.user.update({
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
  }
}
