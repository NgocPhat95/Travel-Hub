import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlaceService } from './place.service';
import { GetPlacesDto, CreateQuestionDto, CreateAnswerDto, SuggestEditDto } from './dto/place.dto';

@Controller('places')
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Get()
  getPlaces(@Query() dto: GetPlacesDto) {
    return this.placeService.getPlaces(dto);
  }

  @Get(':id')
  getPlaceDetail(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ipAddress = Array.isArray(rawIp) ? rawIp[0] : rawIp;
    return this.placeService.getPlaceDetail(id, ipAddress);
  }

  @Get(':id/questions')
  getPlaceQuestions(@Param('id') id: string) {
    return this.placeService.getPlaceQuestions(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/questions')
  createQuestion(
    @Param('id') placeId: string,
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateQuestionDto,
  ) {
    return this.placeService.createQuestion(placeId, req.user.sub, dto.content);
  }

  @UseGuards(JwtAuthGuard)
  @Post('questions/:qId/answers')
  createAnswer(
    @Param('qId') questionId: string,
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateAnswerDto,
  ) {
    return this.placeService.createAnswer(questionId, req.user.sub, dto.content);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/suggest-edit')
  suggestEdit(
    @Param('id') placeId: string,
    @Request() req: { user: { sub: string } },
    @Body() dto: SuggestEditDto,
  ) {
    return this.placeService.suggestEdit(placeId, req.user.sub, dto.proposedData);
  }
}
