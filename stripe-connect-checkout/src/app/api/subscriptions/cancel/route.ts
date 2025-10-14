import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONNECT_ACCOUNT_ID } from '@/lib/stripe-connect';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, immediate = false, reason } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    console.log('🔴 CANCELLING SUBSCRIPTION');
    console.log('📋 Subscription ID:', subscriptionId);
    console.log('⚡ Immediate cancel:', immediate);
    console.log('📝 Reason:', reason || 'No reason provided');

    if (!STRIPE_CONNECT_ACCOUNT_ID) {
      return NextResponse.json(
        { error: 'STRIPE_CONNECT_ACCOUNT_ID not configured' },
        { status: 500 }
      );
    }

    // Use Connect Stripe instance
    const connectedStripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
      stripeAccount: STRIPE_CONNECT_ACCOUNT_ID,
    });

    let updatedSubscription: Stripe.Subscription;

    if (immediate) {
      // Cancel immediately
      console.log('🚨 Canceling subscription immediately');
      updatedSubscription = await connectedStripe.subscriptions.cancel(subscriptionId, {
        cancellation_details: {
          reason: 'requested_by_customer',
          comment: reason || 'Customer requested cancellation',
        },
      });
    } else {
      // Cancel at period end
      console.log('⏰ Canceling subscription at period end');
      updatedSubscription = await connectedStripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        cancellation_details: {
          reason: 'requested_by_customer',
          comment: reason || 'Customer requested cancellation',
        },
        metadata: {
          cancellation_reason: reason || 'Customer requested cancellation',
          cancelled_at: new Date().toISOString(),
        },
      });
    }

    console.log('✅ Subscription updated successfully');
    console.log('📋 Updated Status:', updatedSubscription.status);
    console.log('⏰ Cancel at period end:', updatedSubscription.cancel_at_period_end);

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        current_period_end: updatedSubscription.current_period_end,
        canceled_at: updatedSubscription.canceled_at,
        ended_at: updatedSubscription.ended_at,
      },
    });

  } catch (error) {
    console.error('❌ Error canceling subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}