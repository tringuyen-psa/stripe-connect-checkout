import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class CheckoutService {
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

  async createPaymentIntent(paymentData: {
    amount: number;
    currency: string;
    customerEmail: string;
    paymentMethodId?: string;
    stripeAccountId?: string;
  }) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: paymentData.currency,
        metadata: {
          customerEmail: paymentData.customerEmail,
        },
        payment_method: paymentData.paymentMethodId,
        confirmation_method: paymentData.paymentMethodId ? 'manual' : 'automatic',
        confirm: !!paymentData.paymentMethodId,
        ...(paymentData.stripeAccountId && {
          stripeAccount: paymentData.stripeAccountId,
        }),
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createExpressCheckoutPayment(paymentData: {
    amount: number;
    currency: string;
    customerEmail: string;
    paymentMethod?: string;
    stripeAccountId?: string;
    customerInfo?: any;
    countryCode?: string;
  }) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100),
        currency: paymentData.currency,
        metadata: {
          customerEmail: paymentData.customerEmail,
          expressCheckout: 'true',
        },
        automatic_payment_methods: {
          enabled: true,
        },
        ...(paymentData.stripeAccountId && {
          stripeAccount: paymentData.stripeAccountId,
        }),
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        status: paymentIntent.status,
        paymentIntent,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createPaymentMethod(paymentMethodData: any) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create(paymentMethodData);
      return {
        success: true,
        paymentMethod,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
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
      const charge = await this.stripe.charges.create({
        amount: Math.round(chargeData.amount * 100),
        currency: chargeData.currency,
        source: chargeData.source,
        description: chargeData.description,
      }, chargeData.stripeAccountId ? {
        stripeAccount: chargeData.stripeAccountId,
      } : {});

      return {
        success: true,
        charge,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}