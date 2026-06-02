import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [PrismaModule, SearchModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
