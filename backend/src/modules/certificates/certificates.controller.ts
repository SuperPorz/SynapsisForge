import {
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { Public } from 'src/common/decorators/public.decorator';
import { Request } from 'express';

@ApiTags('Certificates')
@ApiBearerAuth()
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // ─── GET /certificates/verify/:certificate_code ── PUBBLICO ──────────────
  @Public()
  @Get('verify/:certificate_code')
  @ApiOperation({
    summary: 'Verifica autenticità di un certificato (pubblico)',
  })
  @ApiParam({
    name: 'certificate_code',
    description: 'UUID del certificato',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Certificato trovato e verificato' })
  @ApiResponse({ status: 404, description: 'Certificato non trovato' })
  verify(@Param('certificate_code', ParseUUIDPipe) certificate_code: string) {
    return this.certificatesService.verify(certificate_code);
  }

  // ─── GET /certificates/my ─────────────────────────────────────────────────
  @ApiBearerAuth()
  @Get('my')
  @ApiOperation({
    summary: "Recupera tutti i certificati dell'utente autenticato",
  })
  @ApiResponse({ status: 200, description: 'Lista dei certificati' })
  findMy(@Req() req: Request & { user: { id: string } }) {
    const userId = req.user['id'];
    return this.certificatesService.findByUser(userId);
  }

  // ─── GET /certificates/:id/download ──────────────────────────────────────
  @ApiBearerAuth()
  @Get(':id/download')
  @ApiOperation({ summary: 'Scarica il PDF del certificato (presigned URL)' })
  @ApiParam({ name: 'id', description: 'UUID del certificato', type: String })
  @ApiResponse({ status: 200, description: 'Presigned download URL' })
  @ApiResponse({ status: 404, description: 'Certificato non trovato' })
  @ApiResponse({ status: 403, description: 'Accesso negato' })
  download(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    const userId = req.user['id'];
    return this.certificatesService.download(id, userId);
  }

  // ─── GET /certificates/:id ────────────────────────────────────────────────
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Recupera un certificato per ID interno' })
  @ApiParam({ name: 'id', description: 'UUID del certificato', type: String })
  @ApiResponse({ status: 200, description: 'Certificato trovato' })
  @ApiResponse({ status: 404, description: 'Certificato non trovato' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.certificatesService.findOne(id);
  }

  // ─── PATCH /certificates/:id/revoke ──────────────────────────────────────
  @ApiBearerAuth()
  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Revoca un certificato' })
  @ApiParam({ name: 'id', description: 'UUID del certificato', type: String })
  @ApiResponse({ status: 200, description: 'Certificato revocato' })
  @ApiResponse({ status: 400, description: 'Certificato già revocato' })
  @ApiResponse({ status: 404, description: 'Certificato non trovato' })
  revoke(@Param('id', ParseUUIDPipe) id: string) {
    return this.certificatesService.revoke(id);
  }
}
