import { Controller, Get, Param, Query, Req, Res, Post, Body, Patch, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('sync-partner-feed')
  async syncPartnerFeed() {
    return this.bookingService.syncBookingFeeds();
  }

  @Get('places/:placeId/prices')
  async getPrices(@Param('placeId') placeId: string) {
    return this.bookingService.getPlacePrices(placeId);
  }

  @Get('redirect')
  async redirect(
    @Query('placeId') placeId: string,
    @Query('partnerName') partnerName: string,
    @Query('userId') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // 1. Get client IP address
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ipAddress = Array.isArray(rawIp) ? rawIp[0] : rawIp;

    // 2. Log click log to database
    try {
      await this.bookingService.logAffiliateClick(
        placeId,
        partnerName,
        userId || undefined,
        ipAddress,
      );
    } catch (e) {
      console.error('Failed to log affiliate click:', e.message);
    }

    // 3. Generate affiliate URL
    const redirectUrl = await this.bookingService.getAffiliateLink(placeId, partnerName);

    // 4. Perform 302 Redirect
    return res.redirect(302, redirectUrl);
  }

  @Post('reserve')
  @UseGuards(JwtAuthGuard)
  async reserve(
    @Req() req: any,
    @Body() dto: {
      placeId: string;
      checkIn: string;
      checkOut?: string;
      guestsCount: number;
      totalPrice?: number;
      specialRequests?: string;
    },
  ) {
    const userId = req.user.sub;
    return this.bookingService.createReservation(userId, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyBookings(@Req() req: any) {
    const userId = req.user.sub;
    return this.bookingService.getMyBookings(userId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id') bookingId: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.bookingService.cancelBooking(bookingId, userId);
  }
}

