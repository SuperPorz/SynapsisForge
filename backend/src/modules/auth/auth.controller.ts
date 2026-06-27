// prettier-ignore
import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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

@ApiTags('auth')
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
  @ApiOperation({ summary: 'Crea utente e invia email di verifica' })
  async register(@Body() body: CreateUserDto) {
    return this.authService.register(body);
  }

  @Public()
  @Get('/verify-email/:token')
  @ApiOperation({ summary: 'Verifica email e restituisce access token' })
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
  @Post('/login')
  @ApiOperation({
    summary: 'Restituisce access token, refresh token in cookie',
  })
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
    summary: 'Rinnova access token tramite refresh token in cookie',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'] as string | undefined;
    if (!refreshToken) throw new UnauthorizedException();

    const payload = this.jwtService.decode<{ sub: string }>(refreshToken);
    if (!payload?.sub) throw new UnauthorizedException();

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(payload.sub, refreshToken);

    res.cookie('refresh_token', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken };
  }

  @Post('/logout')
  @ApiOperation({ summary: 'Invalida refresh token e pulisce il cookie' })
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
  @ApiOperation({ summary: 'Richiede link di reset password via email' })
  async passwordReset(@Body() body: PasswordResetDto) {
    return this.authService.sendPasswordReset(body);
  }

  @Public()
  @Post('/password/confirm')
  @ApiOperation({ summary: 'Conferma reset password con token' })
  async passwordConfirm(@Body() body: PasswordConfirmDto) {
    return this.authService.confirmPasswordReset(body);
  }

  // ── OAuth Google ──────────────────────────────────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
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
  githubLogin(): void {}

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
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
