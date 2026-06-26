import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BraintreeGateway, Environment } from 'braintree';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from 'src/common/entities/payments.entity';
import { Course } from 'src/common/entities/courses.entity';
import { StudentProfile } from 'src/common/entities/student-profile.entity';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { CartItem } from 'src/common/entities/cart-item.entity';
import { User } from 'src/common/entities/users.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Course,
      StudentProfile,
      Enrollment,
      CartItem,
      User,
    ]),
    EnrollmentsModule,
  ],
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
