import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Feature Modules
    PaymentModule,
  ],
})
export class AppModule {}