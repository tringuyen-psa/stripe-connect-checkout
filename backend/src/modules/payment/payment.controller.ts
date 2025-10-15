import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import Stripe from 'stripe';

@ApiTags('payment')
@Controller()
export class PaymentController {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'API is running successfully' })
  getHealth() {
    return {
      success: true,
      message: 'Stripe Payment API is running!',
      timestamp: new Date().toISOString()
    };
  }

  @Post('payment/create-checkout-session')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 201, description: 'Checkout session created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price: { type: 'number' },
              quantity: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        customerEmail: { type: 'string' }
      },
      required: ['items']
    }
  })
  async createCheckoutSession(@Body() body: { items: any[]; customerEmail?: string }) {
    try {
      const { items, customerEmail } = body;

      const line_items = items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description || '',
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity || 1,
      }));

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${this.configService.get<string>('FRONTEND_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get<string>('FRONTEND_URL')}/cancel`,
        customer_email: customerEmail,
        metadata: {
          order_type: 'simple_payment',
        },
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to create checkout session',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('payment/webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async webhook(@Body() body: any, headers: any) {
    const sig = headers['stripe-signature'];
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    let event;

    try {
      event = this.stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      throw new HttpException(
        {
          success: false,
          error: 'Webhook signature verification failed',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Payment completed:', session.id);
        // Here you can save payment info to database, send emails, etc.
        break;
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }
}