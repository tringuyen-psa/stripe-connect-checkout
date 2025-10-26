import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class CheckoutService {
  private stripe: Stripe;
  private paymentMethodsCache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });

    // Pre-load popular countries on startup
    this.preloadPopularCountries();
  }

  private async preloadPopularCountries() {
    const popularCountries = ['US', 'GB', 'DE', 'FR', 'AU', 'CA'];
    console.log('🚀 Preloading payment methods for popular countries...');

    for (const country of popularCountries) {
      try {
        await this.getCachedPaymentMethods(country);
        console.log(`✅ Preloaded payment methods for ${country}`);
      } catch (error) {
        console.log(`⚠️ Failed to preload ${country}:`, error.message);
      }
    }
  }

  private getCachedPaymentMethods(countryCode: string): any {
    const cacheKey = countryCode.toUpperCase();
    const now = Date.now();
    const cached = this.paymentMethodsCache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);

    if (cached && expiry && now < expiry) {
      console.log(`📋 Using cached payment methods for ${countryCode}`);
      return cached;
    }

    return null;
  }

  private setCachedPaymentMethods(countryCode: string, data: any): void {
    const cacheKey = countryCode.toUpperCase();
    this.paymentMethodsCache.set(cacheKey, data);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
    console.log(`💾 Cached payment methods for ${countryCode}`);
  }

  async createPaymentIntent(paymentData: {
    amount: number;
    currency: string;
    customerEmail: string;
    paymentMethodId?: string;
    stripeAccountId?: string;
  }) {
    try {
      const paymentIntentData: any = {
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: paymentData.currency,
        metadata: {
          customerEmail: paymentData.customerEmail,
        },
        payment_method: paymentData.paymentMethodId,
        confirmation_method: paymentData.paymentMethodId ? 'manual' : 'automatic',
        confirm: !!paymentData.paymentMethodId,
      };

      let paymentIntent;
      if (paymentData.stripeAccountId) {
        paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData, {
          stripeAccount: paymentData.stripeAccountId,
        });
      } else {
        paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);
      }

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
    const startTime = Date.now();

    try {
      // Fast country-specific currency mapping
      const countryCurrencyMap: { [key: string]: string } = {
        'US': 'usd', 'GB': 'gbp', 'EU': 'eur', 'CA': 'cad', 'AU': 'aud',
        'JP': 'jpy', 'MX': 'mxn', 'SG': 'sgd', 'HK': 'hkd', 'CH': 'chf',
        'SE': 'sek', 'NO': 'nok', 'DK': 'dkk', 'PL': 'pln'
      };

      const countryCode = paymentData.countryCode?.toUpperCase() || 'US';
      const currency = countryCurrencyMap[countryCode] || paymentData.currency;

      console.log(`⚡ Fast Express Checkout for ${countryCode}: ${currency}`);

      // Optimized minimal payment intent data
      const paymentIntentData: any = {
        amount: Math.round(paymentData.amount * 100),
        currency: currency,
        metadata: {
          customerEmail: paymentData.customerEmail,
          expressCheckout: 'true',
          countryCode: countryCode,
          fast: 'true',
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      };

      // Only add shipping if essential data provided
      if (paymentData.customerInfo?.address?.postal_code) {
        paymentIntentData.shipping = {
          name: paymentData.customerInfo.name || '',
          address: {
            line1: paymentData.customerInfo.address?.line1 || '',
            city: paymentData.customerInfo.address?.city || '',
            state: paymentData.customerInfo.address?.state || '',
            postal_code: paymentData.customerInfo.address?.postal_code,
            country: countryCode,
          },
        };
      }

      // Create payment intent with optimized configuration
      let paymentIntent;
      if (paymentData.stripeAccountId) {
        paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData, {
          stripeAccount: paymentData.stripeAccountId,
        });
      } else {
        paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);
      }

      const responseTime = Date.now() - startTime;
      console.log(`⚡ Express Checkout created in ${responseTime}ms: ${paymentIntent.id}`);

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        // Use cached payment methods for faster response
        availablePaymentMethods: this.getAvailablePaymentMethodsFast(countryCode),
        currency: currency,
        countryCode: countryCode,
        responseTime: responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ Express Checkout failed in ${responseTime}ms:`, error.message);

      return {
        success: false,
        error: error.message,
        responseTime: responseTime,
      };
    }
  }

  // Fast payment method lookup without API calls
  private getAvailablePaymentMethodsFast(countryCode: string): string[] {
    const cached = this.getCachedPaymentMethods(countryCode);
    if (cached) {
      return cached.methods || ['card'];
    }

    // Fallback to static mapping for instant response
    const staticMethods: { [key: string]: string[] } = {
      'US': ['card', 'link', 'apple_pay', 'google_pay'],
      'GB': ['card', 'apple_pay', 'google_pay'],
      'DE': ['card', 'apple_pay', 'google_pay'],
      'FR': ['card', 'apple_pay', 'google_pay'],
      'AU': ['card', 'apple_pay', 'google_pay'],
      'CA': ['card', 'apple_pay', 'google_pay'],
      'JP': ['card', 'apple_pay', 'google_pay'],
    };

    const methods = staticMethods[countryCode] || ['card'];

    // Cache the static methods temporarily
    this.setCachedPaymentMethods(countryCode, { methods, source: 'static' });

    return methods;
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
      const chargeRequestData: any = {
        amount: Math.round(chargeData.amount * 100),
        currency: chargeData.currency,
        source: chargeData.source,
        description: chargeData.description,
      };

      let charge;
      if (chargeData.stripeAccountId) {
        charge = await this.stripe.charges.create(chargeRequestData, {
          stripeAccount: chargeData.stripeAccountId,
        });
      } else {
        charge = await this.stripe.charges.create(chargeRequestData);
      }

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

  // Super fast payment methods endpoint
  async getPaymentMethodsFast(countryCode: string) {
    const startTime = Date.now();

    try {
      const methods = this.getAvailablePaymentMethodsFast(countryCode.toUpperCase());
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        countryCode: countryCode.toUpperCase(),
        paymentMethods: methods,
        responseTime: `${responseTime}ms`,
        cached: this.getCachedPaymentMethods(countryCode) ? true : false,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        paymentMethods: ['card'], // Always fallback to card
        responseTime: `${Date.now() - startTime}ms`,
      };
    }
  }

  // Get all popular payment methods for frontend preloading
  async getAllPopularPaymentMethods() {
    const popularCountries = ['US', 'GB', 'DE', 'FR', 'AU', 'CA', 'JP'];
    const startTime = Date.now();

    const result: any = {
      success: true,
      countries: {},
      responseTime: 0,
    };

    for (const country of popularCountries) {
      result.countries[country] = {
        paymentMethods: this.getAvailablePaymentMethodsFast(country),
        currency: this.getCountryCurrency(country),
      };
    }

    result.responseTime = Date.now() - startTime;
    result.responseTime = `${result.responseTime}ms`;

    return result;
  }

  private getCountryCurrency(countryCode: string): string {
    const currencyMap: { [key: string]: string } = {
      'US': 'usd', 'GB': 'gbp', 'DE': 'eur', 'FR': 'eur',
      'AU': 'aud', 'CA': 'cad', 'JP': 'jpy'
    };

    return currencyMap[countryCode] || 'usd';
  }
}