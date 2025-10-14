import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

export { stripe };
export const STRIPE_CONNECT_ACCOUNT_ID = process.env.STRIPE_CONNECT_ACCOUNT_ID;

export async function createProductWithCheckout({
  name,
  price,
  currency = 'usd',
  description,
}: {
  name: string;
  price: number;
  currency?: string;
  description?: string;
}) {
  try {
    // Direct Charge - Tạo product và price với Connect account
    if (STRIPE_CONNECT_ACCOUNT_ID) {
      // Tạo Connect Stripe instance để tạo product và price
      const connectStripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-09-30.clover',
        typescript: true,
        stripeAccount: STRIPE_CONNECT_ACCOUNT_ID,
      });

      // Tạo product với Connect account
      const connectProduct = await connectStripe.products.create({
        name,
        description,
        type: 'service',
      });

      // Tạo price với Connect account
      const connectPrice = await connectStripe.prices.create({
        product: connectProduct.id,
        unit_amount: Math.round(price * 100), // Convert to cents
        currency,
      });

      // Tạo checkout session với Connect account
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: connectPrice.id, // Dùng price của Connect account
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
        metadata: {
          product_id: connectProduct.id,
          product_name: name,
        },
      };

      // Tạo session với Connect account
      const connectSession = await connectStripe.checkout.sessions.create(sessionConfig);

      // Console log chi tiết để debug
      console.log('🎯🎯🎯 DIRECT CHARGE - CHECKOUT INFO CHI TIẾT 🎯🎯🎯');
      console.log('🌐 Checkout API URL:', connectSession.url);
      console.log('🔗 Full Checkout Link:', connectSession.url);
      console.log('📋 Session ID:', connectSession.id);
      console.log('🏪 Connect Account (hiển thị trong giao diện):', STRIPE_CONNECT_ACCOUNT_ID);
      console.log('📦 Product ID:', connectProduct.id);
      console.log('💰 Price ID:', connectPrice.id);
      console.log('💵 Price amount:', Math.round(price * 100) + ' cents');
      console.log('💱 Currency:', currency);
      console.log('🔑 Account sẽ nhận tiền:', STRIPE_CONNECT_ACCOUNT_ID);
      console.log('📱 Copy link trên để test thanh toán trên mobile/desktop');
      console.log('⚡ Link format: https://checkout.stripe.com/c/pay/cs_xxx');
      console.log('💸 Tiền đi thẳng vào Connect account - không cần transfer');
      console.log('=========================================================');

      return {
        success: true,
        data: {
          sessionId: connectSession.id,
          checkoutUrl: connectSession.url!,
          checkoutStripeUrl: connectSession.url, // Thêm link checkout.stripe.com
          product: {
            id: connectProduct.id,
            name,
            price,
            currency,
            description,
          },
          connectAccountId: STRIPE_CONNECT_ACCOUNT_ID,
          chargeType: 'direct' // Direct Charge
        },
      };
    }

    // Nếu không có Connect Account, trả về error
    throw new Error('STRIPE_CONNECT_ACCOUNT_ID is required for Direct Charge');
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function addShippingFeeAndRecreateCheckout({
  originalSessionId,
  shippingFee,
  shippingDescription = "Phí vận chuyển",
}: {
  originalSessionId: string;
  shippingFee: number;
  shippingDescription?: string;
}) {
  try {
    if (!STRIPE_CONNECT_ACCOUNT_ID) {
      throw new Error('STRIPE_CONNECT_ACCOUNT_ID is required');
    }

    // Tạo Connect Stripe instance
    const connectStripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
      stripeAccount: STRIPE_CONNECT_ACCOUNT_ID,
    });

    // Lấy thông tin session cũ
    const originalSession = await connectStripe.checkout.sessions.retrieve(originalSessionId, {
      expand: ['line_items'],
    });

    if (!originalSession.line_items?.data) {
      throw new Error('Cannot retrieve original session items');
    }

    // Tạo shipping fee product trong Connect account
    const shippingProduct = await connectStripe.products.create({
      name: shippingDescription,
      description: `Phí vận chuyển cho đơn hàng ${originalSessionId}`,
      type: 'service',
    });

    // Tạo price cho shipping fee
    const shippingPrice = await connectStripe.prices.create({
      product: shippingProduct.id,
      unit_amount: Math.round(shippingFee * 100), // Convert to cents
      currency: 'usd',
    });

    // Chuẩn bị line items mới (cả sản phẩm cũ + phí vận chuyển)
    const newLineItems = [
      ...originalSession.line_items.data.map(item => ({
        price: item.price?.id,
        quantity: item.quantity || 1,
      })),
      {
        price: shippingPrice.id,
        quantity: 1,
      },
    ];

    // Tạo checkout session mới với phí vận chuyển
    const newSessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: newLineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      metadata: {
        ...originalSession.metadata,
        original_session_id: originalSessionId,
        shipping_fee_added: 'true',
        shipping_fee_amount: shippingFee.toString(),
      },
    };

    const newSession = await connectStripe.checkout.sessions.create(newSessionConfig);

    // Console log chi tiết khi thêm phí vận chuyển
    console.log('🚚🚚🚚 THÊM PHÍ VẬN CHUYỂN VÀ TẠO LẠI CHECKOUT 🚚🚚🚚');
    console.log('📦 Original Session ID:', originalSessionId);
    console.log('💰 Phí vận chuyển thêm:', shippingFee + ' USD');
    console.log('📄 Shipping Product ID:', shippingProduct.id);
    console.log('💳 Shipping Price ID:', shippingPrice.id);
    console.log('🔗 New Checkout URL:', newSession.url);
    console.log('📋 New Session ID:', newSession.id);
    console.log('🏪 Connect Account:', STRIPE_CONNECT_ACCOUNT_ID);
    console.log('📊 Tổng line items:', newLineItems.length + ' items');
    console.log('✨ Copy link mới để thanh toán với phí vận chuyển!');
    console.log('=========================================================');

    return {
      success: true,
      data: {
        originalSessionId,
        newSessionId: newSession.id,
        checkoutUrl: newSession.url!,
        checkoutStripeUrl: newSession.url,
        shippingFee,
        shippingProductId: shippingProduct.id,
        connectAccountId: STRIPE_CONNECT_ACCOUNT_ID,
        totalItems: newLineItems.length,
        originalItems: originalSession.line_items.data.length,
        message: 'Đã thêm phí vận chuyển và tạo lại checkout session'
      },
    };
  } catch (error) {
    console.error('Error adding shipping fee:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function retrieveCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent'],
    });

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    console.error('Error retrieving session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function createPaymentIntent({
  amount,
  currency = 'usd',
  connectedAccountId,
}: {
  amount: number;
  currency?: string;
  connectedAccountId?: string;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      payment_method_types: ['card'],
      transfer_data: connectedAccountId
        ? {
            destination: connectedAccountId,
          }
        : undefined,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      data: paymentIntent,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}