import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Payment Intent ID from Stripe',
    example: 'pi_1234567890abcdef'
  })
  paymentIntentId: string;

  @ApiProperty({
    description: 'Customer information',
    example: {
      email: 'customer@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      address: '123 Main St',
      city: 'New York',
      country: 'US',
      postalCode: '10001'
    }
  })
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };

  @ApiProperty({
    description: 'List of items in the order',
    example: [
      {
        name: 'Product Name',
        price: 2999,
        quantity: 2
      }
    ]
  })
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;

  @ApiProperty({
    description: 'Order subtotal in cents',
    example: 5998
  })
  subtotal: number;

  @ApiProperty({
    description: 'Tax amount in cents',
    example: 600
  })
  tax: number;

  @ApiProperty({
    description: 'Shipping cost in cents',
    example: 400
  })
  shipping: number;

  @ApiProperty({
    description: 'Total amount in cents',
    example: 6998
  })
  total: number;

  @ApiProperty({
    description: 'Payment method used',
    example: 'pm_1234567890'
  })
  paymentMethodId?: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd'
  })
  currency: string;

  @ApiProperty({
    description: 'Whether this was an express checkout payment',
    example: false
  })
  isExpressCheckout?: boolean;
}