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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { Public } from 'src/common/decorators/public.decorator';
import { Request } from 'express';

@ApiTags('Certificates')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // ─── GET /certificates/verify/:certificate_code ── PUBBLICO ──────────────
  @Public()
  @Get('verify/:certificate_code')
  @ApiOperation({
    summary: 'Verify certificate authenticity (public)',
  })
  @ApiParam({
    name: 'certificate_code',
    description: 'UUID of the certificate',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Certificate found and verified' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  verify(@Param('certificate_code', ParseUUIDPipe) certificate_code: string) {
    return this.certificatesService.verify(certificate_code);
  }

  // ─── GET /certificates/my ─────────────────────────────────────────────────
  @ApiBearerAuth()
  @Get('my')
  @ApiOperation({
    summary: 'Get all certificates for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'List of certificates' })
  findMy(@Req() req: Request & { user: { id: string } }) {
    const userId = req.user['id'];
    return this.certificatesService.findByUser(userId);
  }

  // ─── GET /certificates/:id/download ──────────────────────────────────────
  @ApiBearerAuth()
  @Get(':id/download')
  @ApiOperation({ summary: 'Download certificate PDF (presigned URL)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the certificate',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Presigned download URL' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
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
  @ApiOperation({ summary: 'Get a certificate by internal ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the certificate',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Certificate found' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.certificatesService.findOne(id);
  }

  // ─── PATCH /certificates/:id/revoke ──────────────────────────────────────
  @ApiBearerAuth()
  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Revoke a certificate' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the certificate',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Certificate revoked' })
  @ApiResponse({ status: 400, description: 'Certificate already revoked' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  revoke(@Param('id', ParseUUIDPipe) id: string) {
    return this.certificatesService.revoke(id);
  }
}
