import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';

@Module({
  imports: [PrismaModule, RedisModule, CloudinaryModule],
  providers: [BusinessService],
  controllers: [BusinessController],
  exports: [BusinessService],
})
export class BusinessModule {}
