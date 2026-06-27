import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { GoogleUserPayload } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private static readonly logger = new Logger('GoogleStrategy');

  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID_NOT_SET';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET_NOT_SET';

    if (!process.env.GOOGLE_CLIENT_ID) {
      GoogleStrategy.logger.warn(
        '[GoogleStrategy] GOOGLE_CLIENT_ID not set. Google OAuth will be unavailable. ' +
        'Email/password login still works normally.'
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleUserPayload {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('Google account has no email.');
    }

    return {
      email,
      fullName: profile.displayName || email,
      googleId: profile.id,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
  }
}
