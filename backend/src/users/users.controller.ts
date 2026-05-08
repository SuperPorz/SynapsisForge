import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
// prettier-ignore
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, } from '@nestjs/swagger';
import { ResponseUserDto } from './dto/response-user.dto';
// JwtAuthGuard verrà implementato nel modulo Auth.
// Per ora è importato come placeholder — decommentare quando disponibile.
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

// Tipo temporaneo per req.user fino all'implementazione di JwtStrategy.
// Sostituire con l'interfaccia reale quando AuthModule sarà pronto.
interface AuthenticatedRequest extends Request {
  user: { userId: string };
}

@ApiTags('Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
// @UseGuards(JwtAuthGuard) // decommentare quando JwtAuthGuard è disponibile
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ---------------------------------------------------------------------------
  // GET /users/me
  // Restituisce il profilo dell'utente autenticato.
  // L'userId viene estratto dal token JWT tramite req.user, non dall'URL —
  // così un utente non può mai leggere il profilo di un altro.
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiOkResponse({ type: ResponseUserDto })
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest): Promise<ResponseUserDto> {
    return this.usersService.getProfile(req.user.userId);
  }

  // ---------------------------------------------------------------------------
  // PATCH /users/me
  // Aggiorna i campi modificabili del profilo: first_name, last_name,
  // birth_date, country. Email e role sono esclusi dal DTO.
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Update authenticated user profile' })
  @ApiOkResponse({ type: ResponseUserDto })
  @Patch('me')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    return this.usersService.updateProfile(req.user.userId, dto);
  }
}
