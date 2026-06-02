import { Module } from '@nestjs/common';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { TripGateway } from './trip.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TripController],
  providers: [TripService, TripGateway],
  exports: [TripService],
})
export class TripModule {}
