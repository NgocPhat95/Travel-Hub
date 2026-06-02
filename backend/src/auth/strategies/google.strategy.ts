import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { GoogleUserPayload } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'MOCK_CLIENT_ID_FOR_DEV',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'MOCK_CLIENT_SECRET',
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
