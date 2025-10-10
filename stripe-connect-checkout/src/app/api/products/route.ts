import { NextRequest, NextResponse } from 'next/server';
import { createProductWithCheckout } from '@/lib/stripe-connect';
import { ProductInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ProductInput = await request.json();

    // Validate input
    if (!body.name || !body.price) {
      return NextResponse.json(
        { error: 'Product name and price are required' },
        { status: 400 }
      );
    }

    if (body.price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    const result = await createProductWithCheckout(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}