import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CheckoutService } from './checkout.service';

@Controller('payments')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() paymentData: any) {
    return this.checkoutService.createPaymentIntent(paymentData);
  }

  @Post('express-checkout')
  async createExpressCheckoutPayment(@Body() paymentData: any) {
    return this.checkoutService.createExpressCheckoutPayment(paymentData);
  }

  @Get('confirm/:paymentIntentId')
  async confirmPayment(@Param('paymentIntentId') paymentIntentId: string) {
    return this.checkoutService.confirmPayment(paymentIntentId);
  }

  @Post('create-payment-method')
  async createPaymentMethod(@Body() paymentMethodData: any) {
    return this.checkoutService.createPaymentMethod(paymentMethodData);
  }

  @Post('confirm-payment')
  async confirmCardPayment(@Body() confirmPaymentData: any) {
    // This would integrate payment method with payment intent
    return { success: true, message: 'Payment confirmation endpoint' };
  }

  @Post('create-charge')
  async createCharge(@Body() chargeData: any) {
    return this.checkoutService.createCharge(chargeData);
  }

  @Post('test-payment-methods')
  async testPaymentMethods(@Body() testData: { countryCode?: string; currency?: string }) {
    return this.checkoutService.testAvailablePaymentMethods(testData);
  }
}