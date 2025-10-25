import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });
  }

  async createPaymentIntent(createPaymentIntentDto: CreatePaymentIntentDto) {
    try {
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(createPaymentIntentDto.amount * 100), // Convert to cents
        currency: createPaymentIntentDto.currency.toLowerCase(),
        metadata: {
          customerEmail: createPaymentIntentDto.customerEmail,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // If stripeAccountId is provided, create a destination charge
      if (createPaymentIntentDto.stripeAccountId) {
        paymentIntentParams.transfer_data = {
          destination: createPaymentIntentDto.stripeAccountId,
        };

        // If payment method is provided, attach it to the intent
        if (createPaymentIntentDto.paymentMethodId) {
          paymentIntentParams.payment_method = createPaymentIntentDto.paymentMethodId;
          paymentIntentParams.confirm = true;
          paymentIntentParams.return_url = `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/success`;
        }
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back to dollars
        currency: paymentIntent.currency,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  async createPaymentMethod(paymentMethodData: {
    type: string;
    card: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    };
    billing_details?: {
      name: string;
      email: string;
      address?: {
        line1: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    };
  }) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: paymentMethodData.card,
        billing_details: paymentMethodData.billing_details,
      });

      return {
        paymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
        card: {
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          exp_month: paymentMethod.card?.exp_month,
          exp_year: paymentMethod.card?.exp_year,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create payment method: ${error.message}`);
    }
  }

  async attachPaymentMethodToIntent(paymentMethodId: string, paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      return {
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to attach payment method: ${error.message}`);
    }
  }

  async createCharge(charargeData: {
    amount: number;
    currency: string;
    source: string;
    description?: string;
    stripeAccountId?: string;
  }) {
    try {
      const chargeParams: Stripe.ChargeCreateParams = {
        amount: Math.round(charargeData.amount * 100),
        currency: charargeData.currency.toLowerCase(),
        source: charargeData.source,
        description: charargeData.description || 'Payment for order',
      };

      // Create charge on connected account if stripeAccountId is provided
      if (charargeData.stripeAccountId) {
        // Use Stripe Connect to create charge on behalf of connected account
        const charge = await this.stripe.charges.create({
          ...chargeParams,
          transfer_data: {
            destination: charargeData.stripeAccountId,
          },
        });

        return {
          chargeId: charge.id,
          status: charge.status,
          amount: charge.amount / 100,
          currency: charge.currency,
          destination: charargeData.stripeAccountId,
        };
      } else {
        // Create charge on platform account
        const charge = await this.stripe.charges.create(chargeParams);

        return {
          chargeId: charge.id,
          status: charge.status,
          amount: charge.amount / 100,
          currency: charge.currency,
        };
      }
    } catch (error) {
      throw new BadRequestException(`Failed to create charge: ${error.message}`);
    }
  }
}