import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsNumber, IsOptional, IsISO31661Alpha2 } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Payment amount in base currency (e.g., 10.00 for $10.00)',
    example: 10.00,
    minimum: 0.50,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Three-letter ISO currency code',
    example: 'usd',
    enum: ['usd', 'eur', 'gbp', 'cad', 'aud', 'jpy'],
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  customerEmail: string;

  @ApiPropertyOptional({
    description: 'Existing payment method ID to use',
    example: 'pm_1234567890',
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'Stripe Connect account ID for platform payments',
    example: 'acct_1234567890',
  })
  @IsOptional()
  @IsString()
  stripeAccountId?: string;
}

export class ExpressCheckoutDto {
  @ApiProperty({
    description: 'Payment amount in base currency',
    example: 29.99,
    minimum: 0.50,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Three-letter ISO currency code',
    example: 'usd',
    enum: ['usd', 'eur', 'gbp', 'cad', 'aud', 'jpy'],
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  customerEmail: string;

  @ApiPropertyOptional({
    description: 'Two-letter ISO country code for payment method optimization',
    example: 'US',
    enum: ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'AU', 'CA', 'JP', 'MX', 'SG', 'HK'],
  })
  @IsOptional()
  @IsISO31661Alpha2()
  countryCode?: string;

  @ApiPropertyOptional({
    description: 'Customer information for better payment method detection',
    example: {
      name: 'John Doe',
      address: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US'
      }
    },
  })
  @IsOptional()
  customerInfo?: {
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };

  @ApiPropertyOptional({
    description: 'Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsOptional()
  @IsString()
  stripeAccountId?: string;
}

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'Payment Intent ID to confirm',
    example: 'pi_1234567890',
  })
  @IsString()
  paymentIntentId: string;
}

export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Payment method type',
    example: 'card',
    enum: ['card', 'apple_pay', 'google_pay'],
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Payment method data (varies by type)',
    example: {
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2024,
        cvc: '123',
      }
    },
  })
  paymentMethodData: any;
}

export class CreateChargeDto {
  @ApiProperty({
    description: 'Charge amount in base currency',
    example: 25.00,
    minimum: 0.50,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Three-letter ISO currency code',
    example: 'usd',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Payment source (token, card ID, etc.)',
    example: 'tok_1234567890',
  })
  @IsString()
  source: string;

  @ApiPropertyOptional({
    description: 'Charge description',
    example: 'Payment for Order #12345',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsOptional()
  @IsString()
  stripeAccountId?: string;
}

export class TestPaymentMethodsDto {
  @ApiPropertyOptional({
    description: 'Two-letter ISO country code',
    example: 'US',
    enum: ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'AU', 'CA', 'JP'],
  })
  @IsOptional()
  @IsISO31661Alpha2()
  countryCode?: string;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'usd',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}