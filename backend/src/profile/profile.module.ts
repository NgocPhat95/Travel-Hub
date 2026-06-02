import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, AuthModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
