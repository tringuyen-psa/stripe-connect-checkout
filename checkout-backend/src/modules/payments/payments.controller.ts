import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("create-payment-intent")
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto
  ) {
    return this.paymentsService.createPaymentIntent(createPaymentIntentDto);
  }

  @Get("confirm/:paymentIntentId")
  async confirmPayment(@Param("paymentIntentId") paymentIntentId: string) {
    return this.paymentsService.confirmPayment(paymentIntentId);
  }

  @Post("create-payment-method")
  async createPaymentMethod(
    @Body()
    paymentMethodData: {
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
    }
  ) {
    return this.paymentsService.createPaymentMethod(paymentMethodData);
  }

  @Post("confirm-payment")
  async confirmCardPayment(
    @Body()
    confirmPaymentData: {
      paymentMethodId: string;
      paymentIntentId: string;
    }
  ) {
    return this.paymentsService.attachPaymentMethodToIntent(
      confirmPaymentData.paymentMethodId,
      confirmPaymentData.paymentIntentId
    );
  }

  @Post("create-charge")
  async createCharge(
    @Body()
    chargeData: {
      amount: number;
      currency: string;
      source: string;
      description?: string;
      stripeAccountId?: string;
    }
  ) {
    return this.paymentsService.createCharge(chargeData);
  }
}
