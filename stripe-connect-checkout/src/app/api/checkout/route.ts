import { NextRequest, NextResponse } from 'next/server';
import { retrieveCheckoutSession } from '@/lib/stripe-connect';
import { STRIPE_CONNECT_ACCOUNT_ID } from '@/lib/stripe-connect';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }

  try {
    console.log('🔍 Retrieving checkout session:', sessionId);
    console.log('🏪 Using Connect Account:', STRIPE_CONNECT_ACCOUNT_ID);

    // Sử dụng Connect Stripe instance để retrieve session
    if (STRIPE_CONNECT_ACCOUNT_ID) {
      const connectStripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-09-30.clover',
        typescript: true,
        stripeAccount: STRIPE_CONNECT_ACCOUNT_ID,
      });

      const session = await connectStripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'payment_intent', 'customer'],
      });

      console.log('✅ Successfully retrieved checkout session from Connect account');
      console.log('📋 Session data:', {
        id: session.id,
        payment_status: session.payment_status,
        customer: session.customer,
        amount_total: session.amount_total,
        currency: session.currency,
        created: session.created,
      });

      return NextResponse.json(session);
    } else {
      // Fallback: dùng function cũ nếu không có Connect account
      const result = await retrieveCheckoutSession(sessionId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to retrieve checkout session' },
          { status: 500 }
        );
      }

      return NextResponse.json(result.data);
    }
  } catch (error) {
    console.error('❌ Checkout API Error:', error);
    console.error('❌ Session ID that failed:', sessionId);

    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      if (error.message.includes('No such checkout.session')) {
        errorMessage = 'Order session not found. This order may have expired.';
      } else if (error.message.includes('Invalid API Key')) {
        errorMessage = 'Configuration error. Please contact support.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}