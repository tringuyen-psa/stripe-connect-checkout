import { IsNumber, IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString()
  @IsNotEmpty()
  line1: string;

  @IsString()
  @IsOptional()
  line2?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  postal_code: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

class CustomerInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @Type(() => AddressDto)
  @ValidateNested()
  address?: AddressDto;
}

export class CreateExpressPaymentDto {
  @IsNumber()
  @Min(0.5)
  amount: number;

  @IsString()
  @IsEnum(['usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'sgd', 'brl', 'mxn', 'inr'])
  currency: string;

  @IsEmail()
  customerEmail: string;

  @IsOptional()
  @IsEnum(['apple-pay', 'google-pay', 'paypal', 'link', 'klarna', 'amazon-pay', 'afterpay-clearpay', 'cashapp', 'alipay', 'wechat-pay'])
  paymentMethod?: 'apple-pay' | 'google-pay' | 'paypal' | 'link' | 'klarna' | 'amazon-pay' | 'afterpay-clearpay' | 'cashapp' | 'alipay' | 'wechat-pay';

  @IsString()
  @IsOptional()
  stripeAccountId?: string;

  @IsOptional()
  @Type(() => CustomerInfoDto)
  @ValidateNested()
  customerInfo?: CustomerInfoDto;

  @IsString()
  @IsOptional()
  @IsEnum(['US', 'GB', 'DE', 'FR', 'NL', 'CA', 'AU', 'JP', 'SG', 'BR', 'MX', 'IN'])
  countryCode?: string;
}