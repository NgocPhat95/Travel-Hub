import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessService } from './business.service';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post('claims')
  @UseInterceptors(FileInterceptor('document'))
  async claimListing(
    @Request() req: { user: { sub: string } },
    @Body('placeId') placeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.businessService.createClaim(req.user.sub, placeId, file);
  }

  @Get('places')
  async getPlaces(@Request() req: { user: { sub: string } }) {
    return this.businessService.getOwnedPlaces(req.user.sub);
  }

  @Post('reviews/:reviewId/responses')
  async respondToReview(
    @Request() req: { user: { sub: string } },
    @Param('reviewId') reviewId: string,
    @Body('content') content: string,
  ) {
    return this.businessService.respondToReview(req.user.sub, reviewId, content);
  }

  @Get('places/:placeId/analytics')
  async getAnalytics(
    @Request() req: { user: { sub: string } },
    @Param('placeId') placeId: string,
  ) {
    return this.businessService.getAnalytics(placeId, req.user.sub);
  }
}
