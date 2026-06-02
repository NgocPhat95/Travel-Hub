import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';

class GenerateItineraryDto {
  @IsNotEmpty()
  @IsString()
  destination: string;

  @IsNotEmpty()
  days: any; // Accept string or number to prevent ValidationPipe type casting failures

  @IsNotEmpty()
  @IsString()
  budget: string;

  @IsNotEmpty()
  @IsString()
  companions: string;
}

class ChatDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  chatHistory: { role: 'user' | 'model'; parts: string }[];
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAuthGuard)
  @Post('itinerary')
  async generateItinerary(
    @Request() req: any,
    @Body() dto: GenerateItineraryDto,
  ) {
    console.log('AI Controller: generateItinerary request body:', dto);
    console.log('AI Controller: authenticated user:', req.user);
    
    // Safely cast days to integer
    const daysNum = parseInt(dto.days, 10);
    const userId = req.user.sub;
    
    return this.aiService.generateItinerary(
      userId,
      dto.destination,
      daysNum,
      dto.budget,
      dto.companions,
    );
  }

  @Post('chat')
  async chat(@Body() dto: ChatDto) {
    return this.aiService.chat(dto.message, dto.chatHistory || []);
  }
}
