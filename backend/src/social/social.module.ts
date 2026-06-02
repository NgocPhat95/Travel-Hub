import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { SocialGateway } from './social.gateway';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  providers: [SocialService, SocialGateway],
  controllers: [SocialController],
  exports: [SocialService, SocialGateway],
})
export class SocialModule {}
