import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({}), MailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
