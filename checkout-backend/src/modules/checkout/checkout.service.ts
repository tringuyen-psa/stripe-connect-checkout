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
      // Country-specific currency mapping for better payment method support
      const countryCurrencyMap: { [key: string]: string } = {
        'US': 'usd',
        'GB': 'gbp',
        'EU': 'eur',
        'CA': 'cad',
        'AU': 'aud',
        'JP': 'jpy',
        'MX': 'mxn',
        'SG': 'sgd',
        'HK': 'hkd',
        'CH': 'chf',
        'SE': 'sek',
        'NO': 'nok',
        'DK': 'dkk',
        'PL': 'pln'
      };

      // Use country-specific currency if provided, otherwise default
      const currency = paymentData.countryCode
        ? countryCurrencyMap[paymentData.countryCode.toUpperCase()] || paymentData.currency
        : paymentData.currency;

      console.log(`🌍 Creating Express Checkout for country: ${paymentData.countryCode}, currency: ${currency}`);

      const paymentIntentData: any = {
        amount: Math.round(paymentData.amount * 100),
        currency: currency,
        metadata: {
          customerEmail: paymentData.customerEmail,
          expressCheckout: 'true',
          countryCode: paymentData.countryCode || 'US',
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      };

      // Express Checkout works best with automatic payment methods
      // Stripe will automatically enable available payment methods based on:
      // 1. Country/Currency combination
      // 2. Account capabilities and activation
      // 3. Customer's device/browser support

      // Note: For PayPal, Google Pay, Apple Pay to appear:
      // 1. Your Stripe account must be activated for these methods
      // 2. The country must support these payment methods
      // 3. The currency must be compatible
      // 4. The customer's browser/device must support the method

      // Add customer information if provided
      if (paymentData.customerInfo) {
        paymentIntentData.shipping = {
          name: paymentData.customerInfo.name || '',
          address: {
            line1: paymentData.customerInfo.address?.line1 || '',
            line2: paymentData.customerInfo.address?.line2 || '',
            city: paymentData.customerInfo.address?.city || '',
            state: paymentData.customerInfo.address?.state || '',
            postal_code: paymentData.customerInfo.address?.postal_code || '',
            country: paymentData.countryCode || 'US',
          },
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData,
        paymentData.stripeAccountId ? {
          stripeAccount: paymentData.stripeAccountId,
        } : {}
      );

      console.log(`✅ Express Checkout created: ${paymentIntent.id}, available methods: ${paymentIntent.payment_method_types?.join(', ')}`);

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        availablePaymentMethods: paymentIntent.payment_method_types,
        currency: currency,
        countryCode: paymentData.countryCode,
      };
    } catch (error) {
      console.error('❌ Express Checkout creation failed:', error.message);
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

  async testAvailablePaymentMethods(testData: { countryCode?: string; currency?: string }) {
    try {
      console.log(`🔍 Testing available payment methods for country: ${testData.countryCode}, currency: ${testData.currency}`);

      // Country to currency mapping
      const countryCurrencyMap: { [key: string]: string } = {
        'US': 'usd', 'GB': 'gbp', 'DE': 'eur', 'FR': 'eur',
        'IT': 'eur', 'ES': 'eur', 'AU': 'aud', 'CA': 'cad',
        'JP': 'jpy', 'MX': 'mxn', 'SG': 'sgd', 'HK': 'hkd'
      };

      const currency = testData.currency || countryCurrencyMap[testData.countryCode?.toUpperCase()] || 'usd';

      // Create a test payment session to check available methods
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: currency,
            product_data: { name: 'Test Product' },
            unit_amount: 1000, // $10.00
          },
          quantity: 1,
        }],
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        ...(testData.countryCode && {
          customer_creation: 'always',
          customer_email: 'test@example.com',
          shipping_address_collection: {
            allowed_countries: [testData.countryCode.toUpperCase() as any],
          },
        }),
      });

      // Test different payment method types
      const paymentMethodTests = [
        { type: 'card', name: 'Credit/Debit Card' },
        { type: 'paypal', name: 'PayPal' },
        { type: 'apple_pay', name: 'Apple Pay' },
        { type: 'google_pay', name: 'Google Pay' },
        { type: 'klarna', name: 'Klarna' },
        { type: 'afterpay_clearpay', name: 'Afterpay/Clearpay' },
      ];

      const availableMethods = [];

      for (const method of paymentMethodTests) {
        try {
          // Try to create a payment method to test availability
          if (method.type === 'card') {
            availableMethods.push({ ...method, available: true, note: 'Always available' });
          } else {
            // For other methods, check if they're supported in the country
            const isSupported = this.isPaymentMethodSupported(method.type, testData.countryCode?.toUpperCase());
            availableMethods.push({
              ...method,
              available: isSupported,
              note: isSupported ? 'Supported in this country' : 'Not supported or not activated'
            });
          }
        } catch (error) {
          availableMethods.push({
            ...method,
            available: false,
            note: error.message
          });
        }
      }

      return {
        success: true,
        country: testData.countryCode,
        currency: currency,
        availablePaymentMethods: availableMethods,
        recommendations: this.getPaymentMethodRecommendations(testData.countryCode?.toUpperCase()),
        stripeAccountId: process.env.STRIPE_ACCOUNT_ID || 'default',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private isPaymentMethodSupported(paymentMethod: string, country?: string): boolean {
    // Payment method country support matrix
    const supportMatrix: { [key: string]: string[] } = {
      'paypal': ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'AU', 'CA', 'NL', 'BE', 'AT'],
      'apple_pay': ['US', 'GB', 'CA', 'AU', 'JP', 'SG', 'HK', 'FR', 'DE', 'IT', 'ES', 'NL'],
      'google_pay': ['US', 'GB', 'CA', 'AU', 'JP', 'SG', 'HK', 'FR', 'DE', 'IT', 'ES', 'NL', 'BR', 'PL'],
      'klarna': ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'FI', 'NO', 'SE', 'DK'],
      'afterpay_clearpay': ['US', 'CA', 'AU', 'NZ', 'GB'],
    };

    return country ? (supportMatrix[paymentMethod]?.includes(country) || false) : false;
  }

  private getPaymentMethodRecommendations(country?: string): string[] {
    const recommendations: { [key: string]: string[] } = {
      'US': ['card', 'paypal', 'apple_pay', 'google_pay', 'klarna', 'afterpay_clearpay'],
      'GB': ['card', 'paypal', 'apple_pay', 'google_pay', 'klarna'],
      'DE': ['card', 'paypal', 'apple_pay', 'google_pay', 'klarna', 'sepa_debit'],
      'FR': ['card', 'paypal', 'apple_pay', 'google_pay'],
      'AU': ['card', 'paypal', 'apple_pay', 'google_pay', 'afterpay_clearpay'],
      'CA': ['card', 'apple_pay', 'google_pay', 'afterpay_clearpay'],
      'JP': ['card', 'apple_pay', 'google_pay', 'konbini'],
    };

    return recommendations[country?.toUpperCase()] || ['card'];
  }
}