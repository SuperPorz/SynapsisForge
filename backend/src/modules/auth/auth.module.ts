// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { StringValue } from 'ms';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule], // rende ConfigService disponibile
      inject: [ConfigService], // iniettalo nella factory
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          // prettier-ignore
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as StringValue,
        },
      }),
    }),
  ],
  providers: [JwtStrategy, AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
