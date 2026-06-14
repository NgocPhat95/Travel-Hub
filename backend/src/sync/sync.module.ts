import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DataSyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { VietnamDataService } from './providers/vietnam-data.service';
import { TripAdvisorRapidService } from './providers/tripadvisor-rapid.service';
import { BookingComRapidService } from './providers/booking-com-rapid.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    PrismaModule,
    SearchModule,
    HttpModule.register({ timeout: 30000, maxRedirects: 3 }),
  ],
  controllers: [SyncController],
  providers: [
    DataSyncService,
    VietnamDataService,
    TripAdvisorRapidService,
    BookingComRapidService,
  ],
  exports: [DataSyncService],
})
export class SyncModule {}
