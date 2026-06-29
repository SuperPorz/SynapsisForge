import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { CheckoutDto } from './dto/checkout.dto';
import { SubscribeDto } from './dto/subscribe.dto';

@ApiTags('Payments')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('client-token')
  @ApiOperation({ summary: 'Generate a Braintree client token for Drop-in UI' })
  @ApiResponse({ status: 200, description: 'Client token generated.' })
  async getClientToken() {
    return this.paymentsService.generateClientToken();
  }

  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process a single course purchase via Braintree' })
  @ApiBody({ type: CheckoutDto })
  @ApiResponse({ status: 201, description: 'Payment processed successfully.' })
  @ApiResponse({ status: 400, description: 'Payment failed or invalid data.' })
  async checkout(
    @Req() req: { user: { id: string } },
    @Body() dto: CheckoutDto,
  ) {
    return this.paymentsService.checkout(req.user.id, dto);
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a recurring subscription via Braintree' })
  @ApiBody({ type: SubscribeDto })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully.',
  })
  async subscribe(
    @Req() req: { user: { id: string } },
    @Body() dto: SubscribeDto,
  ) {
    return this.paymentsService.subscribe(req.user.id, dto);
  }

  @Get('subscription/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved.' })
  async getStatus(@Req() req: { user: { id: string } }) {
    return this.paymentsService.getSubscriptionStatus(req.user.id);
  }

  @Post('subscription/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel the current subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled.' })
  async cancel(@Req() req: { user: { id: string } }) {
    return this.paymentsService.cancelSubscription(req.user.id);
  }

  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history for the authenticated user' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Payment history retrieved.' })
  async getHistory(
    @Req() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getHistory(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Braintree webhook notifications' })
  @ApiResponse({ status: 200, description: 'Webhook received.' })
  async handleWebhook(
    @Body() body: { bt_signature: string; bt_payload: string },
  ) {
    return this.paymentsService.handleWebhook(
      body.bt_signature,
      body.bt_payload,
    );
  }
}
