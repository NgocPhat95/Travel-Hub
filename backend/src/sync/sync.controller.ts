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

  @Get('scrape-images')
  async scrapeImages() {
    const queries = ['Vietnam', 'Hanoi', 'Saigon', 'Da Nang', 'Phu Quoc', 'Nha Trang', 'Hoi An', 'Da Lat', 'Sapa'];
    const allImages: string[] = [];
    for (const q of queries) {
      const imgs = await this.syncService.scrapeImages(q);
      allImages.push(...imgs);
      // Brief sleep between queries to avoid booking rate limit
      await new Promise(r => setTimeout(r, 1000));
    }
    const uniqueImages = [...new Set(allImages)];
    return {
      count: uniqueImages.length,
      images: uniqueImages,
    };
  }


  @Get('check-booking')
  async checkBooking() {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\dc0216ba-90bf-49a0-84c4-04290281e4b4\\.system_generated\\steps\\6312\\content.md';
      if (!fs.existsSync(filePath)) {
        return { error: 'File not found at: ' + filePath };
      }
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Match raw image URLs (with max resolution or other dimensions)
      const regex = /https:\/\/cf\.bstatic\.com\/xdata\/images\/hotel\/[^\s"'>]+/g;
      const matches = content.match(regex) || [];
      const unique = [...new Set(matches)].map((url: string) => url.replace(/&amp;/g, '&'));
      return {
        count: unique.length,
        images: unique.slice(0, 100),
      };
    } catch (e: any) {
      return { error: e.message };
    }
  }
}

