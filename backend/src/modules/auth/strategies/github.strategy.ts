import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { EnvironmentVariables } from 'src/common/types/env';
import { AuthService } from '../auth.service';
import { Profile, Strategy } from 'passport-github2';
import { VerifyCallback } from 'passport-oauth2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID', { infer: true }),
      clientSecret: configService.get('GITHUB_CLIENT_SECRET', { infer: true }),
      callbackURL: configService.get('GITHUB_CALLBACK_URL', { infer: true }),
      scope: ['user:email'],
    });
  }

  override authorizationParams(): Record<string, string> {
    return {
      prompt: 'select_account consent',
    };
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value ?? null;
    const firstName =
      profile.name?.givenName ?? profile.displayName ?? 'GitHub';
    const lastName = profile.name?.familyName ?? 'User';

    const tokens = await this.authService.findOrCreateOAuthUser(
      'github',
      profile.id,
      email,
      firstName,
      lastName,
    );

    done(null, tokens);
  }
}
