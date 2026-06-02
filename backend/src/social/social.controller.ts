import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles, Request, Put, Delete } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SocialService } from './social.service';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('posts')
  @UseInterceptors(FilesInterceptor('images', 10))
  async createPost(
    @Request() req: any,
    @Body('content') content: string,
    @Body('placeId') placeId?: string,
    @Body('tripId') tripId?: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const userId = req.user.sub;
    return this.socialService.createPost(userId, content, placeId, tripId, files);
  }

  @Get('feed')
  async getNewsFeed(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') targetUserId?: string,
  ) {
    const userId = req.user.sub;
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.socialService.getNewsFeed(userId, pageNum, limitNum, targetUserId);
  }

  @Post('posts/:id/like')
  async toggleLike(@Request() req: any, @Param('id') postId: string) {
    const userId = req.user.sub;
    return this.socialService.toggleLike(userId, postId);
  }

  @Post('posts/:id/comments')
  async addComment(
    @Request() req: any,
    @Param('id') postId: string,
    @Body('content') content: string,
  ) {
    const userId = req.user.sub;
    return this.socialService.addComment(userId, postId, content);
  }

  @Delete('posts/:id')
  async deletePost(@Request() req: any, @Param('id') postId: string) {
    const userId = req.user.sub;
    return this.socialService.deletePost(userId, postId);
  }

  @Put('posts/:id')
  async updatePost(
    @Request() req: any,
    @Param('id') postId: string,
    @Body('content') content: string,
    @Body('placeId') placeId?: string,
    @Body('tripId') tripId?: string,
  ) {
    const userId = req.user.sub;
    return this.socialService.updatePost(userId, postId, content, placeId, tripId);
  }
}
