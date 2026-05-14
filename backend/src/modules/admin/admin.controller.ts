import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { CourseActionsDto } from './dto/course-actions.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/entities/enum/users.enum';

@ApiTags('Admin')
@ApiUnauthorizedResponse({
  description: 'Non autorizzato - JWT mancante o invalido.',
})
@ApiForbiddenResponse({
  description: 'Accesso negato - Permessi admin insufficienti.',
})
@Roles(UserRole.ADMIN) // ← protegge tutti gli endpoint del controller
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── GET /admin/users ────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Ottieni utenti filtrati',
    description:
      'Ritorna una lista di utenti filtrabile per ruolo (UserRole) e stato di attività.',
  })
  @ApiOkResponse({ description: 'Lista utenti recuperata con successo.' })
  @ApiBadRequestResponse({
    description:
      'Parametri di filtro non validi (es. ruolo inesistente o formato boolean errato).',
  })
  @Get('users')
  filtered_users(@Query() filters: FilterUsersDto) {
    // Gestisce i filtri role (enum) e is_active (boolean trasformato)
    return this.adminService.find_users(filters);
  }

  // ─── PATCH /admin/courses/:id/approve ────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Approva un corso',
    description:
      'Imposta lo stato di un corso specifico su "approvato". Richiede un ID valido (UUID).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del corso da approvare',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Corso approvato con successo.' })
  @ApiNotFoundResponse({ description: 'Corso non trovato.' })
  @ApiBadRequestResponse({ description: 'ID fornito non è un UUID valido.' })
  @Patch('courses/:id/approve')
  approve_course(@Param() filters: CourseActionsDto) {
    // Utilizza CourseActionsDto per validare l'ID come UUID
    return this.adminService.approve(filters);
  }

  // ─── PATCH /admin/courses/:id/reject ────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Rifiuta un corso',
    description: 'Imposta lo stato di un corso specifico su "rifiutato".',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del corso da rifiutare',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({ description: 'Corso rifiutato con successo.' })
  @ApiNotFoundResponse({ description: 'Corso non trovato.' })
  @ApiBadRequestResponse({ description: 'ID fornito non è un UUID valido.' })
  @Patch('courses/:id/reject')
  reject_course(@Param() filters: CourseActionsDto) {
    // L'ID viene estratto e validato tramite CourseActionsDto
    return this.adminService.reject(filters);
  }

  // ─── GET /admin/stats ────────────────────────────────────────────────
  @ApiOperation({
    summary: 'Statistiche globali',
    description:
      'Ritorna statistiche della piattaforma (utenti, corsi, vendite).',
  })
  @ApiOkResponse({ description: 'Statistiche generate con successo.' })
  @Get('stats')
  get_stats() {
    return this.adminService.stats();
  }
}
