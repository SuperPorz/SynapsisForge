import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from 'src/common/entities/users.entity';
import { UsersModule } from '../users/users.module';
import { StringValue } from 'ms';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UsersModule, // espone UsersService
    TypeOrmModule.forFeature([User]), // espone Repository<User>
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_ACCESS_EXPIRES_IN',
            '15m',
          ) as StringValue,
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, GoogleStrategy],
  exports: [JwtModule],
  controllers: [AuthController],
})
export class AuthModule {}
