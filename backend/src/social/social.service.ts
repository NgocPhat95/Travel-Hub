import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SocialGateway } from './social.gateway';

@Injectable()
export class SocialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly socialGateway: SocialGateway,
  ) {}

  async createPost(
    userId: string,
    content: string,
    placeId?: string,
    tripId?: string,
    files?: Express.Multer.File[],
  ): Promise<any> {
    // 1. Create the post record
    const post = await this.prisma.post.create({
      data: {
        userId,
        content,
        placeId: placeId || null,
        tripId: tripId || null,
      },
    });

    // 2. Upload images if present
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `post_${post.id}_img_${i}_${Date.now()}`;
        const uploadResult = await this.cloudinary.uploadPostImage(file.buffer, fileName);
        
        await this.prisma.postImage.create({
          data: {
            postId: post.id,
            url: uploadResult.secureUrl,
          },
        });
      }
    }

    // 3. Return the fully loaded post
    return this.prisma.post.findUnique({
      where: { id: post.id },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        place: { select: { id: true, name: true, address: true } },
        trip: { select: { id: true, title: true, startDate: true, endDate: true } },
        images: true,
        likes: true,
        comments: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async getNewsFeed(userId: string, page = 1, limit = 10, targetUserId?: string): Promise<any> {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (targetUserId) {
      where.userId = targetUserId;
    }

    const posts = await this.prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        place: { select: { id: true, name: true, address: true } },
        trip: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            ownerId: true,
          },
        },
        images: true,
        likes: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });

    // Transform posts to include likedByCurrentUser flag and simple counts
    return posts.map((post) => {
      const likedByCurrentUser = post.likes.some((like) => like.userId === userId);
      return {
        ...post,
        likedByCurrentUser,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
      };
    });
  }

  async toggleLike(userId: string, postId: string): Promise<any> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng.');
    }

    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    let isLike = false;
    if (existingLike) {
      // Unlike
      await this.prisma.postLike.delete({
        where: { id: existingLike.id },
      });
    } else {
      // Like
      await this.prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });
      isLike = true;
    }

    // Get updated like count
    const likeCount = await this.prisma.postLike.count({
      where: { postId },
    });

    // Broadcast update via WebSocket Gateway
    this.socialGateway.emitPostLiked(postId, userId, isLike, likeCount);

    return { success: true, isLike, likeCount };
  }

  async addComment(userId: string, postId: string, content: string): Promise<any> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng.');
    }

    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        userId,
        content,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    // Broadcast update via WebSocket Gateway
    this.socialGateway.emitPostCommented(postId, comment);

    return comment;
  }

  async deletePost(userId: string, postId: string): Promise<any> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (post.userId !== userId && user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Bạn không có quyền xóa bài viết này.');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { success: true };
  }

  async updatePost(
    userId: string,
    postId: string,
    content: string,
    placeId?: string,
    tripId?: string,
  ): Promise<any> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (post.userId !== userId && user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài viết này.');
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        content,
        placeId: placeId || null,
        tripId: tripId || null,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        place: { select: { id: true, name: true, address: true } },
        trip: { select: { id: true, title: true, startDate: true, endDate: true } },
        images: true,
        likes: true,
        comments: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });
  }
}
