import {
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: DataSyncService) {}

  /**
   * POST /sync/trigger
   * Kích hoạt sync thủ công — bảo vệ bằng X-Sync-Secret header
   */
  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerSync(@Headers('x-sync-secret') secret: string) {
    const adminSecret = process.env.SYNC_SECRET || 'travelhub_sync_2026';
    if (secret !== adminSecret) {
      throw new UnauthorizedException('Invalid sync secret.');
    }
    // Chạy async để không block request
    this.syncService.runFullSync().catch((e) =>
      console.error('[SyncController] Sync error:', e.message),
    );
    return {
      message: '🚀 Đã bắt đầu sync dữ liệu từ RapidAPI. Quá trình có thể mất 2-5 phút.',
      status: 'STARTED',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  getStatus() {
    return this.syncService.getStatus();
  }

  @Get('force')
  async forceSync() {
    this.syncService.runFullSync().catch((e) =>
      console.error('[SyncController] Force Sync error:', e.message),
    );
    return {
      message: '🚀 Đã kích hoạt cưỡng bức đồng bộ dữ liệu du lịch Việt Nam!',
      status: 'STARTED',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('check-booking')
  async checkBooking() {
    const key = process.env.RAPIDAPI_KEY || '';
    const host = 'booking-com15.p.rapidapi.com';
    const results: any[] = [];
    
    try {
      const res = await this.syncService.bookingComService.searchLocationId('Sapa');
      results.push({ test: 'searchLocationId Sapa', destId: res });
    } catch (e: any) {
      results.push({ test: 'searchLocationId Sapa', error: e.message });
    }

    try {
      const url = `https://${host}/api/v1/hotels/searchDestination`;
      const res = await this.syncService.bookingComService['httpService'].axiosRef.get(url, {
        headers: {
          'X-RapidAPI-Key': key,
          'X-RapidAPI-Host': host,
        },
        params: { query: 'Sapa', languagecode: 'vi' }
      });
      results.push({ test: 'raw searchDestination', status: res.status, data: res.data });
    } catch (e: any) {
      results.push({ 
        test: 'raw searchDestination', 
        error: e.message, 
        status: e.response?.status, 
        data: e.response?.data 
      });
    }

    try {
      const taKey = key;
      const taHost = 'tripadvisor16.p.rapidapi.com';
      const url = `https://${taHost}/api/v1/restaurant/searchRestaurants`;
      const res = await this.syncService.bookingComService['httpService'].axiosRef.get(url, {
        headers: {
          'X-RapidAPI-Key': taKey,
          'X-RapidAPI-Host': taHost,
        },
        params: { locationId: '293924' }
      });
      results.push({ test: 'raw TripAdvisor rest', status: res.status, data: res.data });
    } catch (e: any) {
      results.push({ 
        test: 'raw TripAdvisor rest', 
        error: e.message, 
        status: e.response?.status, 
        data: e.response?.data 
      });
    }

    return results;
  }
}
