import {
  Body,
  Controller,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthService, AuthTokens } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Public } from 'src/common/decorators/public.decorator';

interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('Auth Mobile')
@Controller('auth/mobile')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AuthMobileController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('/register')
  @ApiOperation({ summary: '[Mobile] Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  async register(@Body() body: CreateUserDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post('/verify-email/:token')
  @ApiOperation({
    summary:
      '[Mobile] Verify email, returns both access and refresh tokens in body',
  })
  @ApiParam({
    name: 'token',
    description: 'UUID verification token',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified, tokens returned.',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  async verifyEmail(
    @Param('token', ParseUUIDPipe) token: string,
  ): Promise<AuthTokens> {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/login')
  @ApiOperation({
    summary:
      '[Mobile] Login, returns both access and refresh tokens in body (no cookie)',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() body: LoginDto): Promise<AuthTokens> {
    return this.authService.login(body);
  }

  @Public()
  @Post('/refresh')
  @ApiOperation({
    summary:
      '[Mobile] Refresh access token using X-Refresh-Token header. Token rotation + reuse detection.',
  })
  @ApiHeader({
    name: 'X-Refresh-Token',
    description: 'The refresh token issued at login or previous refresh',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
  @ApiResponse({
    status: 401,
    description:
      'Invalid, expired, or reused refresh token. Session terminated on reuse detection.',
  })
  async refresh(
    @Headers('x-refresh-token') refreshToken: string | undefined,
  ) {
    if (!refreshToken) throw new UnauthorizedException();

    let payload: { sub: string } | null;
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token scaduto o non valido');
    }
    if (!payload?.sub) throw new UnauthorizedException();

    return this.authService.refreshTokensMobile(payload.sub, refreshToken);
  }

  @ApiBearerAuth()
  @Post('/logout')
  @ApiOperation({
    summary: '[Mobile] Invalidate the current session (refresh token)',
  })
  @ApiResponse({ status: 200, description: 'Logout successful.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
  async logout(@Req() req: RequestWithUser) {
    await this.authService.logout(req.user.id);
    return { message: 'Logout effettuato' };
  }
}
