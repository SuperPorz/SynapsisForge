import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { CheckoutDto } from './dto/checkout.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('client-token')
  @ApiOperation({ summary: 'Generate a Braintree client token for Drop-in UI' })
  async getClientToken() {
    return this.paymentsService.generateClientToken();
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Process a single course purchase via Braintree' })
  async checkout(@Req() req: any, @Body() dto: CheckoutDto) {
    return this.paymentsService.checkout(req.user.id, dto);
  }
}
