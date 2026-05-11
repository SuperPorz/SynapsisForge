import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/common/types/env';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const secret = configService.get('JWT_ACCESS_SECRET', { infer: true });

    if (!secret) {
      // prettier-ignore
      throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: { sub: string; email: string; role: string }) {
    // Quello che ritorni qui finisce in req.user
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
