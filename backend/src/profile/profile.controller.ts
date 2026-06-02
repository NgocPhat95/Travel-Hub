import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: { user: { sub: string } }) {
    return this.profileService.getMe(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
      },
    ),
  )
  updateMe(
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdateProfileDto,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
  ) {
    const avatarFile = files?.avatar?.[0];
    const coverFile = files?.cover?.[0];
    return this.profileService.updateMe(req.user.sub, dto, avatarFile, coverFile);
  }

  @Get('public/:id')
  getPublicProfile(@Param('id') id: string) {
    return this.profileService.getPublicProfile(id);
  }
}
