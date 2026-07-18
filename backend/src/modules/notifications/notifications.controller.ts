import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { User } from 'src/common/entities/users.entity';
import { NotificationsService } from './notifications.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { ResponseDeviceDto } from './dto/response-device.dto';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({
    summary: 'Register or update a device token for push notifications',
  })
  @ApiCreatedResponse({ type: ResponseDeviceDto })
  @Post('devices')
  async registerDevice(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDeviceDto,
  ): Promise<ResponseDeviceDto> {
    return this.notificationsService.registerDevice(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Remove a registered device token' })
  @ApiOkResponse({ description: 'Device token removed' })
  @Delete('devices/:tokenId')
  async removeDevice(
    @Req() req: AuthenticatedRequest,
    @Param('tokenId') tokenId: string,
  ): Promise<{ message: string }> {
    await this.notificationsService.removeDevice(tokenId, req.user.id);
    return { message: 'Device token removed' };
  }

  @ApiOperation({
    summary: 'List all active device tokens for the authenticated user',
  })
  @ApiOkResponse({ type: [ResponseDeviceDto] })
  @Get('devices')
  async listDevices(
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseDeviceDto[]> {
    return this.notificationsService.listDevices(req.user.id);
  }
}
