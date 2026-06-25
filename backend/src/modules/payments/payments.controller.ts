import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';

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
}
