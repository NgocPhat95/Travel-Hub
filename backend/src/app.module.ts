import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ProfileModule } from './profile/profile.module';
import { RedisModule } from './redis/redis.module';
import { SearchModule } from './search/search.module';
import { PlaceModule } from './place/place.module';
import { ReviewModule } from './review/review.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { TripModule } from './trip/trip.module';
import { BookingModule } from './booking/booking.module';
import { BusinessModule } from './business/business.module';
import { AdminModule } from './admin/admin.module';
import { SocialModule } from './social/social.module';
import { AiModule } from './ai/ai.module';
import { ChatModule } from './chat/chat.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    CloudinaryModule,
    AuthModule,
    ProfileModule,
    RedisModule,
    SearchModule,
    PlaceModule,
    ReviewModule,
    WishlistModule,
    TripModule,
    BookingModule,
    BusinessModule,
    AdminModule,
    SocialModule,
    AiModule,
    ChatModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
