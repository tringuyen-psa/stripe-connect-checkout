import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateExpressPaymentDto } from './dto/create-express-payment.dto';

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
        amount: Math.round(createPaymentIntentDto.amount * 100),
        currency: createPaymentIntentDto.currency.toLowerCase(),
        metadata: {
          customerEmail: createPaymentIntentDto.customerEmail,
        },
        // Use activated payment methods including PayPal
        payment_method_types: [
          'card',
          'link',
          'paypal'
        ],
      };

      if (createPaymentIntentDto.stripeAccountId) {
        paymentIntentParams.transfer_data = {
          destination: createPaymentIntentDto.stripeAccountId,
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentMethods: paymentIntent.payment_method_types,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  async createExpressCheckoutPayment(expressPaymentData: CreateExpressPaymentDto) {
    try {
      // Validate amount
      if (!expressPaymentData.amount || expressPaymentData.amount <= 0) {
        throw new BadRequestException('Invalid payment amount');
      }

      // Create simple payment intent for Express Checkout
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(expressPaymentData.amount * 100),
        currency: expressPaymentData.currency.toLowerCase(),
        metadata: {
          customerEmail: expressPaymentData.customerEmail,
          expressCheckout: 'true',
        },
        // Enable automatic payment methods for Express Checkout including PayPal
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'always',
        },
        // Enable future usage for saved payment methods
        setup_future_usage: 'on_session',
      };

      if (expressPaymentData.stripeAccountId) {
        paymentIntentParams.transfer_data = {
          destination: expressPaymentData.stripeAccountId,
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: expressPaymentData.amount,
        currency: expressPaymentData.currency,
        availablePaymentMethods: paymentIntent.payment_method_types,
      };
    } catch (error) {
      console.error('Express checkout error:', error);
      throw new BadRequestException(`Failed to create express checkout: ${error.message}`);
    }
  }

  async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
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

  async createCharge(chargeData: {
    amount: number;
    currency: string;
    source: string;
    description?: string;
    stripeAccountId?: string;
  }) {
    try {
      const chargeParams: Stripe.ChargeCreateParams = {
        amount: Math.round(chargeData.amount * 100),
        currency: chargeData.currency.toLowerCase(),
        source: chargeData.source,
        description: chargeData.description || 'Payment for order',
      };

      if (chargeData.stripeAccountId) {
        const charge = await this.stripe.charges.create({
          ...chargeParams,
          transfer_data: {
            destination: chargeData.stripeAccountId,
          },
        });

        return {
          chargeId: charge.id,
          status: charge.status,
          amount: charge.amount / 100,
          currency: charge.currency,
          destination: chargeData.stripeAccountId,
        };
      } else {
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

  private getPaymentMethodsForCountry(countryCode: string): string[] {
    // Base payment methods (only card and link for now)
    const baseMethods = ['card', 'link']; // Only using activated payment methods

    // Country-specific methods (using only activated methods)
    const countryMethods: Record<string, string[]> = {
      'US': [], // apple_pay, google_pay not activated yet
      'GB': [],
      'DE': [], // klarna not activated yet
      'FR': [],
      'NL': [],
      'CA': [],
      'AU': [],
      'JP': [],
      'SG': [],
      'BR': [],
      'MX': [],
      'IN': [],
    };

    return [...baseMethods, ...(countryMethods[countryCode] || [])];
  }
}