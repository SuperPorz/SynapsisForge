import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { User } from 'src/common/entities/users.entity';

// JwtStrategy.validate() restituisce l'entity User completa — req.user è tipizzato di conseguenza.
interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ---------------------------------------------------------------------------
  // GET /users/me
  // Restituisce il profilo dell'utente autenticato.
  // L'id viene estratto da req.user popolato da JwtStrategy, non dall'URL —
  // così un utente non può mai leggere il profilo di un altro.
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiOkResponse({ type: ResponseUserDto })
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest): Promise<ResponseUserDto> {
    return this.usersService.getProfile(req.user.id);
  }

  // ---------------------------------------------------------------------------
  // PATCH /users/me
  // Aggiorna i campi modificabili del profilo: first_name, last_name,
  // birth_date, country. Email e role sono esclusi dal DTO per sicurezza.
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Update authenticated user profile' })
  @ApiOkResponse({ type: ResponseUserDto })
  @Patch('me')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    return this.usersService.updateProfile(req.user.id, dto);
  }
}
