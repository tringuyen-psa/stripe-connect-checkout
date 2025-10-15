import { IsEmail, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Subscription plan ID',
    example: 1
  })
  @IsNumber()
  planId: number;

  @ApiProperty({
    description: 'Stripe payment method ID',
    example: 'pm_1234567890'
  })
  @IsString()
  paymentMethodId: string;

  @ApiPropertyOptional({
    description: 'Use connected account for direct charge',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  useConnectedAccount?: boolean;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Cancel at period end',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({
    description: 'Use connected account',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  useConnectedAccount?: boolean;
}