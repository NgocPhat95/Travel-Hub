import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':placeId')
  addToWishlist(@Param('placeId') placeId: string, @Request() req: any) {
    return this.wishlistService.addToWishlist(req.user.sub, placeId);
  }

  @Delete(':placeId')
  removeFromWishlist(@Param('placeId') placeId: string, @Request() req: any) {
    return this.wishlistService.removeFromWishlist(req.user.sub, placeId);
  }

  @Get()
  getWishlist(@Request() req: any) {
    return this.wishlistService.getWishlist(req.user.sub);
  }

  @Get(':placeId/status')
  getWishlistStatus(@Param('placeId') placeId: string, @Request() req: any) {
    return this.wishlistService.getWishlistStatus(req.user.sub, placeId);
  }
}
