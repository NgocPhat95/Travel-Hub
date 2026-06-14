import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: 'USER' | 'BUSINESS_OWNER' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
}

export interface AuthResponse {
  user: AuthUserPayload;
  accessToken: string;
  refreshToken: string;
}

export interface GoogleUserPayload {
  email: string;
  fullName: string;
  googleId: string;
  avatarUrl?: string | null;
}

@Injectable()
export class AuthService {
  private readonly accessTokenSecret =
    process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
  private readonly refreshTokenSecret =
    process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
  private readonly backendBaseUrl =
    process.env.BACKEND_BASE_URL || 'http://localhost:3000';
  private readonly frontendBaseUrl =
    process.env.FRONTEND_BASE_URL || 'http://localhost:4200';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const rawVerificationToken = this.generateToken();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        authProvider: 'EMAIL',
        status: 'ACTIVE',
        verificationToken: this.hashToken(rawVerificationToken),
      },
    });

    try {
      await this.mailService.sendVerificationEmail({
        email: user.email,
        fullName: user.fullName,
        verificationLink: `${this.backendBaseUrl}/auth/verify?token=${rawVerificationToken}`,
      });
    } catch (mailError) {
      console.warn(
        'Email sending failed, but user was registered successfully as ACTIVE for dev/testing:',
        mailError.message
      );
      console.log(
        'Verification link:',
        `${this.backendBaseUrl}/auth/verify?token=${rawVerificationToken}`
      );
    }

    const tokens = await this.signTokens(user.id, user.email, user.role);

    return {
      user: this.buildAuthUserPayload(user),
      ...tokens,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Verification token is required.');
    }

    const user = await this.prisma.user.findFirst({
      where: { verificationToken: this.hashToken(token) },
    });

    if (!user) {
      throw new BadRequestException(
        'Verification token is invalid or expired.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        verificationToken: null,
      },
    });

    return { message: 'Email verified successfully.' };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status === 'BANNED') {
      throw new ForbiddenException('Account is banned.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Email is not verified.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokens = await this.signTokens(user.id, user.email, user.role);

    return {
      user: this.buildAuthUserPayload(user),
      ...tokens,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshTokenSecret,
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User inactive or not found.');
      }
      const accessToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        { secret: this.accessTokenSecret, expiresIn: '7d' },
      );
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const rawResetToken = this.generateToken();
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: this.hashToken(rawResetToken) },
      });

      await this.mailService.sendResetPasswordEmail({
        email: user.email,
        fullName: user.fullName,
        resetLink: `${this.frontendBaseUrl}/reset-password?token=${rawResetToken}`,
      });
    }

    return { message: 'If the email exists, a reset link was sent.' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Reset token is required.');
    }

    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: this.hashToken(token) },
    });

    if (!user) {
      throw new BadRequestException('Reset token is invalid or expired.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
      },
    });

    return { message: 'Password reset successfully.' };
  }

  async loginWithGoogle(googleUser: GoogleUserPayload): Promise<AuthResponse> {
    const existingByGoogle = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    const existingByEmail = existingByGoogle
      ? null
      : await this.prisma.user.findUnique({
          where: { email: googleUser.email },
        });

    let user = existingByGoogle ?? existingByEmail;

    if (user) {
      if (user.status === 'BANNED') {
        throw new ForbiddenException('Account is banned.');
      }

      if (!user.googleId || user.authProvider !== 'GOOGLE') {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            authProvider: 'GOOGLE',
            status: 'ACTIVE',
            avatarUrl: user.avatarUrl ?? googleUser.avatarUrl ?? null,
            fullName: user.fullName || googleUser.fullName,
          },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          fullName: googleUser.fullName,
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl ?? null,
          authProvider: 'GOOGLE',
          status: 'ACTIVE',
        },
      });
    }

    const tokens = await this.signTokens(user.id, user.email, user.role);

    return {
      user: this.buildAuthUserPayload(user),
      ...tokens,
    };
  }

  private buildAuthUserPayload(user: {
    id: string;
    email: string;
    role: AuthUserPayload['role'];
    status: AuthUserPayload['status'];
  }): AuthUserPayload {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  private async signTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.accessTokenSecret,
      expiresIn: '7d',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
