import { Controller, Post, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
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

  @Post('stripe')
  async handleStripeWebhook(
    @Body() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );

      this.logger.log(`Processing webhook event: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.processing':
          await this.handlePaymentProcessing(event.data.object as Stripe.PaymentIntent);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);

    // Here you can:
    // 1. Update order status in your database
    // 2. Send confirmation emails
    // 3. Trigger fulfillment processes
    // 4. Update customer records

    const customerEmail = paymentIntent.metadata.customerEmail;
    const isExpressCheckout = paymentIntent.metadata.expressCheckout === 'true';

    this.logger.log(`Payment details:`, {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      customerEmail,
      isExpressCheckout,
      paymentMethod: paymentIntent.payment_method,
    });
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.error(`Payment failed: ${paymentIntent.id}`);

    // Here you can:
    // 1. Update order status to failed
    // 2. Notify customer about payment failure
    // 3. Handle retry logic if applicable

    const lastPaymentError = paymentIntent.last_payment_error;
    if (lastPaymentError) {
      this.logger.error(`Payment error details:`, {
        type: lastPaymentError.type,
        message: lastPaymentError.message,
        code: lastPaymentError.code,
      });
    }
  }

  private async handlePaymentProcessing(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment processing: ${paymentIntent.id}`);

    // Here you can:
    // 1. Update order status to processing
    // 2. Notify customer that payment is being processed
    // 3. Set up monitoring for payment completion
  }

  private async handleCheckoutCompleted(checkoutSession: Stripe.Checkout.Session) {
    this.logger.log(`Checkout completed: ${checkoutSession.id}`);

    // Handle checkout session completion if you're using Stripe Checkout
  }
}