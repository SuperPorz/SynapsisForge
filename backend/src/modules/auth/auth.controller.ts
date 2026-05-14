// prettier-ignore
import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { AuthService, AuthTokens } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';

// Estendi il tipo Request per avere req.user tipizzato
interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

// questo è l'oggetto per salvare il cookie di tipo 'http-only'
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS solo in prod
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 giorni in ms
  path: '/auth/refresh', // il cookie viene inviato SOLO a questa rotta
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Public() // ← fondamentale: senza questo la guardia globale blocca il login
  @Post('/register')
  @ApiOperation({ summary: 'Crea utente e restituisce access token' })
  async register(
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.register(body);
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
    const cookies = req.cookies;
    const refreshToken = cookies['refresh_token'] as string | undefined;
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

  // google auth passport gestisce tutto il redirect
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Body non viene mai eseguito: il guard intercetta e fa redirect a Google
  }

  // 2. google Callback — Google torna qui con il code già scambiato
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(
    @Req() req: Request & { user: AuthTokens },
    @Res() res: Response,
  ): void {
    const { accessToken, refreshToken } = req.user;

    // Opzione TEMPORANEA dev — query param (non sicuro in prod)
    res.redirect(
      `http://localhost:4200/oauth-test.html?provider=google&accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );

    // Opzione FUTURA prod — cookie httpOnly
    // res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'strict' });
    // res.redirect('http://localhost:4200/dashboard');
  }

  // github OAuth
  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin(): void {
    // Body non viene mai eseguito: il guard intercetta e fa redirect a GitHub
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(
    @Req() req: Request & { user: AuthTokens },
    @Res() res: Response,
  ): void {
    const { accessToken, refreshToken } = req.user;

    res.redirect(
      `http://localhost:4200/oauth-test.html?provider=github&accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );

    // Opzione FUTURA prod — cookie httpOnly
    // res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'strict' });
    // res.redirect('http://localhost:4200/dashboard');
  }
}
