// prettier-ignore
import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { PasswordConfirmDto } from './dto/password-confirm.dto';
import { AuthService, AuthTokens } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';

interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth/refresh',
};

@ApiTags('Auth')
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('/register')
  @ApiOperation({ summary: 'Register a new user and send verification email' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  async register(@Body() body: CreateUserDto) {
    return this.authService.register(body);
  }

  @Public()
  @Get('/verify-email/:token')
  @ApiOperation({ summary: 'Verify email and return access token' })
  @ApiParam({ name: 'token', description: 'UUID verification token', type: String })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  async verifyEmail(
    @Param('token', ParseUUIDPipe) token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.verifyEmail(token);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/login')
  @ApiOperation({
    summary: 'Login, returns access token (refresh token in httpOnly cookie)',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(body);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken };
  }

  @Public()
  @Post('/refresh')
  @ApiOperation({
    summary: 'Refresh access token using the refresh token cookie',
  })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'] as string | undefined;
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

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(payload.sub, refreshToken);

    res.cookie('refresh_token', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken };
  }

  @ApiBearerAuth()
  @Post('/logout')
  @ApiOperation({ summary: 'Invalidate refresh token and clear cookie' })
  @ApiResponse({ status: 200, description: 'Logout successful.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.id);
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    return { message: 'Logout effettuato' };
  }

  @Public()
  @Post('/password/reset')
  @ApiOperation({ summary: 'Request a password reset link via email' })
  @ApiBody({ type: PasswordResetDto })
  @ApiResponse({
    status: 200,
    description: 'Reset email sent if the user exists (anti-enumeration).',
  })
  async passwordReset(@Body() body: PasswordResetDto) {
    return this.authService.sendPasswordReset(body);
  }

  @Public()
  @Post('/password/confirm')
  @ApiOperation({ summary: 'Confirm password reset with token' })
  @ApiBody({ type: PasswordConfirmDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  async passwordConfirm(@Body() body: PasswordConfirmDto) {
    return this.authService.confirmPasswordReset(body);
  }

  // ── OAuth Google ──────────────────────────────────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
  @ApiResponse({ status: 302, description: 'Redirect to Google login page.' })
  googleLogin() {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth2 callback handler' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with tokens.',
  })
  googleCallback(
    @Req() req: Request & { user: AuthTokens },
    @Res() res: Response,
  ): void {
    const { accessToken, refreshToken } = req.user;
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.redirect(
      `${frontendUrl}/oauth-callback?provider=google&accessToken=${accessToken}`,
    );
  }

  // ── OAuth GitHub ──────────────────────────────────────────────────────────

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth2 login' })
  @ApiResponse({ status: 302, description: 'Redirect to GitHub login page.' })
  githubLogin(): void {}

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth2 callback handler' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with tokens.',
  })
  githubCallback(
    @Req() req: Request & { user: AuthTokens },
    @Res() res: Response,
  ): void {
    const { accessToken, refreshToken } = req.user;
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.redirect(
      `${frontendUrl}/oauth-callback?provider=github&accessToken=${accessToken}`,
    );
  }
}
