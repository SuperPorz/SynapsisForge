import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { EnvironmentVariables } from 'src/common/types/env';

console.log('>>> google.strategy.ts caricato');

// qui dichiariamo la il guard per Google
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID', { infer: true }),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET', { infer: true }),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL', { infer: true }),
      scope: ['email', 'profile'],
    });
    console.log('GoogleStrategy init:', {
      clientID: configService.get('GOOGLE_CLIENT_ID', { infer: true }),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL', { infer: true }),
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, name } = profile;

    const tokens = await this.authService.findOrCreateOAuthUser(
      'google',
      id,
      emails![0].value,
      name!.givenName,
      name!.familyName,
    );

    done(null, tokens);
  }
}
