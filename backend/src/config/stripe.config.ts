import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeConfigService {
  private readonly stripe: Stripe;
  private readonly connectedStripe: Stripe | null;
  private readonly connectAccountId: string | null;

  constructor(private configService: ConfigService) {
    // Use test keys for development, main keys for production
    const isDevelopment = this.configService.get<string>('NODE_ENV') !== 'production';
    const secretKey = isDevelopment
      ? this.configService.get<string>('STRIPE_SECRET_KEY_TEST')
      : this.configService.get<string>('STRIPE_SECRET_KEY_MAIN');

    this.connectAccountId = isDevelopment
      ? this.configService.get<string>('STRIPE_CONNECT_ACCOUNT_ID_TEST')
      : this.configService.get<string>('STRIPE_CONNECT_ACCOUNT_ID_MAIN');

    if (!secretKey) {
      throw new Error('Stripe secret key not found in configuration');
    }

    console.log('🔑 Using Stripe keys:', isDevelopment ? 'TEST (development)' : 'LIVE (production)');
    console.log('🏪 Connect Account:', this.connectAccountId);

    // Main Stripe instance
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    // Connected Stripe instance for Direct Charge
    this.connectedStripe = this.connectAccountId
      ? new Stripe(secretKey, {
          apiVersion: '2023-10-16',
          typescript: true,
          stripeAccount: this.connectAccountId,
        })
      : null;
  }

  getStripe(useConnectedAccount = false): Stripe {
    if (useConnectedAccount && this.connectedStripe) {
      return this.connectedStripe;
    }
    return this.stripe;
  }

  getConnectAccountId(): string | null {
    return this.connectAccountId;
  }

  getChargeType(useConnectedAccount = false): string {
    return useConnectedAccount ? 'direct' : 'transfer';
  }
}