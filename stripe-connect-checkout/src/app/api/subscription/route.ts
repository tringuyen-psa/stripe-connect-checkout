import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONNECT_ACCOUNT_ID } from '@/lib/stripe-connect';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const {
      customerId,
      priceId,
      email,
      useConnectedAccount = false
    } = await request.json();

    if (!customerId || !priceId) {
      return NextResponse.json(
        { error: 'Customer ID and Price ID are required' },
        { status: 400 }
      );
    }

    let subscription: Stripe.Subscription;

    if (useConnectedAccount && STRIPE_CONNECT_ACCOUNT_ID) {
      // Create subscription cho Connected Account (Direct Charge)
      console.log('🎯 TẠO SUBSCRIPTION CHO CONNECTED ACCOUNT');
      console.log('👤 Customer:', customerId);
      console.log('💰 Price ID:', priceId);
      console.log('🏪 Connect Account:', STRIPE_CONNECT_ACCOUNT_ID);

      const connectedStripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-09-30.clover',
        typescript: true,
        stripeAccount: STRIPE_CONNECT_ACCOUNT_ID,
      });

      subscription = await connectedStripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          connect_account: STRIPE_CONNECT_ACCOUNT_ID,
          customer_email: email || '',
        }
      });

      console.log('✅ Subscription tạo thành công cho Connected Account');
      console.log('📋 Subscription ID:', subscription.id);
      console.log('🔗 Client Secret:', (subscription.latest_invoice as any)?.payment_intent?.client_secret);
      console.log('💸 Tiền subscription sẽ đi vào:', STRIPE_CONNECT_ACCOUNT_ID);
      console.log('=====================================');

    } else {
      // Create subscription thông thường
      console.log('🔹 TẠO SUBSCRIPTION THÔNG THƯỜNG');
      console.log('👤 Customer:', customerId);
      console.log('💰 Price ID:', priceId);

      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        expand: ['latest_invoice.payment_intent'],
        transfer_data: STRIPE_CONNECT_ACCOUNT_ID ? {
          destination: STRIPE_CONNECT_ACCOUNT_ID,
        } : undefined,
        metadata: {
          customer_email: email || '',
        }
      });

      console.log('✅ Subscription tạo thành công');
      console.log('📋 Subscription ID:', subscription.id);
      console.log('🔄 Transfer đến:', STRIPE_CONNECT_ACCOUNT_ID);
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      customerId: subscription.customer,
      status: subscription.status,
      connectedAccountId: useConnectedAccount ? STRIPE_CONNECT_ACCOUNT_ID : null,
      chargeType: useConnectedAccount ? 'direct' : 'transfer',
    });

  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Retrieving subscription:', subscriptionId);

    // Sử dụng Connect Stripe instance để retrieve subscription
    if (STRIPE_CONNECT_ACCOUNT_ID) {
      const connectedStripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-09-30.clover',
        typescript: true,
        stripeAccount: STRIPE_CONNECT_ACCOUNT_ID,
      });

      const subscription = await connectedStripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'latest_invoice', 'items.data.price'],
      });

      console.log('✅ Successfully retrieved subscription from Connect account');
      console.log('📋 Subscription data:', {
        id: subscription.id,
        status: subscription.status,
        customer: subscription.customer,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
      });

      return NextResponse.json(subscription);
    } else {
      // Fallback: dùng stripe instance chính
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'latest_invoice', 'items.data.price'],
      });

      return NextResponse.json(subscription);
    }
  } catch (error) {
    console.error('❌ Subscription API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}