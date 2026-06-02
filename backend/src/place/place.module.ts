import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlaceService } from './place.service';
import { PlaceController } from './place.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [PlaceService],
  controllers: [PlaceController],
  exports: [PlaceService],
})
export class PlaceModule {}
