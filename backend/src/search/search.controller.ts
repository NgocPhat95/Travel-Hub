import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { RedisService } from '../redis/redis.service';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly redisService: RedisService,
  ) {}

  @Get('autocomplete')
  autocomplete(
    @Query('q') query: string,
    @Query('category') category?: string,
  ) {
    return this.searchService.autocomplete(query, category);
  }

  @Get('places')
  searchPlaces(
    @Query('lat') lat?: string,
    @Query('lon') lon?: string,
    @Query('radius') radius?: string,
    @Query('nelat') nelat?: string,
    @Query('nelon') nelon?: string,
    @Query('swlat') swlat?: string,
    @Query('swlon') swlon?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('rating') rating?: string,
    @Query('amenities') amenities?: string | string[],
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    const amenitiesList = Array.isArray(amenities)
      ? amenities
      : amenities
      ? [amenities]
      : [];

    return this.searchService.searchPlaces({
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
      nelat: nelat ? parseFloat(nelat) : undefined,
      nelon: nelon ? parseFloat(nelon) : undefined,
      swlat: swlat ? parseFloat(swlat) : undefined,
      swlon: swlon ? parseFloat(swlon) : undefined,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      rating: rating ? parseFloat(rating) : undefined,
      amenities: amenitiesList,
      category,
      status,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('history')
  async addSearchHistory(
    @Request() req: { user: { sub: string } },
    @Body('term') term: string,
  ) {
    await this.redisService.addSearchHistory(req.user.sub, term);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getSearchHistory(@Request() req: { user: { sub: string } }) {
    return this.redisService.getSearchHistory(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('history')
  async clearSearchHistory(@Request() req: { user: { sub: string } }) {
    await this.redisService.clearSearchHistory(req.user.sub);
    return { success: true };
  }
}
