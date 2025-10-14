import { NextRequest, NextResponse } from 'next/server';
import { addShippingFeeAndRecreateCheckout } from '@/lib/stripe-connect';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.originalSessionId || !body.shippingFee) {
      return NextResponse.json(
        { error: 'Original session ID and shipping fee are required' },
        { status: 400 }
      );
    }

    if (body.shippingFee <= 0) {
      return NextResponse.json(
        { error: 'Shipping fee must be greater than 0' },
        { status: 400 }
      );
    }

    console.log('🚚 API SHIPPING - ĐÃ NHẬN REQUEST');
    console.log('📦 Original Session ID:', body.originalSessionId);
    console.log('💰 Shipping Fee:', body.shippingFee + ' USD');
    console.log('📝 Description:', body.shippingDescription || 'Phí vận chuyển');

    const result = await addShippingFeeAndRecreateCheckout({
      originalSessionId: body.originalSessionId,
      shippingFee: body.shippingFee,
      shippingDescription: body.shippingDescription,
    });

    if (!result.success) {
      console.error('❌ API SHIPPING - LỖI:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log('✅ API SHIPPING - THÀNH CÔNG');
    console.log('🔗 New Checkout URL:', result.data?.checkoutUrl);
    console.log('=====================================');

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('API Shipping Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}