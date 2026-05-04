import { Module } from '@nestjs/common';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';

@Module({
  providers: [JwtStrategy, AuthService],
})
export class AuthModule {}
