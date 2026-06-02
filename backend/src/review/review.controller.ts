import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/review.dto';
import { ReviewService } from './review.service';

function getUserIdFromAuthHeader(authHeader?: string): string | undefined {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }
  try {
    const token = authHeader.split(' ')[1];
    const payloadBase64 = token.split('.')[1];
    const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
    const decoded = JSON.parse(decodedJson);
    return decoded.sub;
  } catch (error) {
    return undefined;
  }
}

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post('places/:placeId')
  @UseInterceptors(
    FilesInterceptor('media', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB per file
    }),
  )
  async createReview(
    @Param('placeId') placeId: string,
    @Request() req: any,
    @Body() dto: CreateReviewDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.reviewService.createReview(placeId, req.user.sub, dto, files);
  }

  @Get('places/:placeId')
  async getReviews(
    @Param('placeId') placeId: string,
    @Headers('authorization') authHeader: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('rating') rating?: number,
  ) {
    const userId = getUserIdFromAuthHeader(authHeader);
    return this.reviewService.getReviews(placeId, { limit, offset, rating }, userId);
  }

  @Get('places/:placeId/stats')
  async getStats(@Param('placeId') placeId: string) {
    return this.reviewService.getReviewStats(placeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async likeReview(@Param('id') reviewId: string, @Request() req: any) {
    return this.reviewService.likeReview(reviewId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  async unlikeReview(@Param('id') reviewId: string, @Request() req: any) {
    return this.reviewService.unlikeReview(reviewId, req.user.sub);
  }
}
