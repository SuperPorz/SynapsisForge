import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BraintreeGateway, Environment } from 'braintree';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'BRAINTREE_GATEWAY',
      useFactory: (configService: ConfigService) =>
        new BraintreeGateway({
          environment: Environment.Sandbox,
          merchantId: configService.get<string>('BRAINTREE_MERCHANT_ID')!,
          publicKey: configService.get<string>('BRAINTREE_PUBLIC_KEY')!,
          privateKey: configService.get<string>('BRAINTREE_PRIVATE_KEY')!,
        }),
      inject: [ConfigService],
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
