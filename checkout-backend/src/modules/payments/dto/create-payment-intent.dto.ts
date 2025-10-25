import { IsNumber, IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(0.5)
  amount: number;

  @IsString()
  @IsEnum(['usd', 'eur', 'gbp', 'cad', 'aud'])
  currency: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsString()
  @IsOptional()
  stripeAccountId?: string;
}