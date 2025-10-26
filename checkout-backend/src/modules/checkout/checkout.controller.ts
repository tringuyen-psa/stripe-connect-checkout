import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import {
  CreatePaymentIntentDto,
  ExpressCheckoutDto,
  ConfirmPaymentDto,
  CreatePaymentMethodDto,
  CreateChargeDto,
  TestPaymentMethodsDto
} from './dto/create-payment-intent.dto';

@ApiTags('Payments')
@Controller('payments')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Create a Payment Intent' })
  @ApiResponse({ status: 200, description: 'Payment Intent created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async createPaymentIntent(@Body() paymentData: CreatePaymentIntentDto) {
    return this.checkoutService.createPaymentIntent(paymentData);
  }

  @Post('express-checkout')
  @ApiOperation({ summary: 'Create Express Checkout Payment Intent' })
  @ApiResponse({ status: 200, description: 'Express Checkout created with country-specific payment methods' })
  @ApiResponse({ status: 400, description: 'Invalid express checkout data' })
  async createExpressCheckoutPayment(@Body() paymentData: ExpressCheckoutDto) {
    return this.checkoutService.createExpressCheckoutPayment(paymentData);
  }

  @Get('confirm/:paymentIntentId')
  @ApiOperation({ summary: 'Confirm Payment Intent Status' })
  @ApiParam({ name: 'paymentIntentId', description: 'Payment Intent ID', example: 'pi_1234567890' })
  @ApiResponse({ status: 200, description: 'Payment Intent status retrieved' })
  @ApiResponse({ status: 404, description: 'Payment Intent not found' })
  async confirmPayment(@Param('paymentIntentId') paymentIntentId: string) {
    return this.checkoutService.confirmPayment(paymentIntentId);
  }

  @Post('create-payment-method')
  @ApiOperation({ summary: 'Create a Payment Method' })
  @ApiResponse({ status: 200, description: 'Payment Method created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment method data' })
  async createPaymentMethod(@Body() paymentMethodData: CreatePaymentMethodDto) {
    return this.checkoutService.createPaymentMethod(paymentMethodData);
  }

  @Post('confirm-payment')
  @ApiOperation({ summary: 'Confirm Card Payment' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Payment confirmation failed' })
  async confirmCardPayment(@Body() confirmPaymentData: ConfirmPaymentDto) {
    // This would integrate payment method with payment intent
    return { success: true, message: 'Payment confirmation endpoint' };
  }

  @Post('create-charge')
  @ApiOperation({ summary: 'Create a Direct Charge' })
  @ApiResponse({ status: 200, description: 'Charge created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid charge data' })
  async createCharge(@Body() chargeData: CreateChargeDto) {
    return this.checkoutService.createCharge(chargeData);
  }

  @Post('test-payment-methods')
  @ApiOperation({ summary: 'Test Available Payment Methods for Country' })
  @ApiResponse({ status: 200, description: 'Available payment methods retrieved' })
  async testPaymentMethods(@Body() testData: TestPaymentMethodsDto) {
    return this.checkoutService.testAvailablePaymentMethods(testData);
  }

  @Get('payment-methods/:countryCode')
  @ApiOperation({ summary: 'Get Available Payment Methods by Country' })
  @ApiParam({ name: 'countryCode', description: 'Two-letter ISO country code', example: 'US' })
  @ApiQuery({ name: 'currency', required: false, description: 'Currency code', example: 'usd' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid country code' })
  async getPaymentMethods(
    @Param('countryCode') countryCode: string,
    @Query('currency') currency?: string
  ) {
    return this.checkoutService.getPaymentMethodsFast(countryCode);
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Get All Popular Payment Methods' })
  @ApiResponse({ status: 200, description: 'All popular payment methods retrieved' })
  async getAllPaymentMethods() {
    return this.checkoutService.getAllPopularPaymentMethods();
  }
}