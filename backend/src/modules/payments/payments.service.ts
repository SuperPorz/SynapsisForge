import { Inject, Injectable, Logger } from '@nestjs/common';
import { BraintreeGateway } from 'braintree';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject('BRAINTREE_GATEWAY') private readonly gateway: BraintreeGateway,
  ) {}

  async generateClientToken(): Promise<{ clientToken: string }> {
    const response = await this.gateway.clientToken.generate({});
    this.logger.log('Client token generated');
    return { clientToken: response.clientToken };
  }
}
