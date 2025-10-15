import { Global, Module } from '@nestjs/common';
import { StripeConfigService } from './stripe.config';

@Global()
@Module({
  providers: [StripeConfigService],
  exports: [StripeConfigService],
})
export class AppConfigModule {}