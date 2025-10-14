import { NextRequest, NextResponse } from 'next/server';
import { STRIPE_CONNECT_ACCOUNT_ID } from '@/lib/stripe-connect';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const customerId = searchParams.get('customer_id');

    console.log('🔍 Fetching subscriptions');
    console.log('📧 Email:', email);
    console.log('👤 Customer ID:', customerId);

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

    let subscriptions: Stripe.Subscription[] = [];

    if (customerId) {
      // Get subscriptions for specific customer
      console.log('🎯 Getting subscriptions for customer:', customerId);
      const customerSubscriptions = await connectedStripe.subscriptions.list({
        customer: customerId,
        limit: 100,
        expand: ['data.customer', 'data.items.data.price', 'data.latest_invoice'],
      });
      subscriptions = customerSubscriptions.data;
    } else if (email) {
      // First find customer by email
      console.log('🎯 Finding customer by email:', email);
      const customers = await connectedStripe.customers.list({
        email: email,
        limit: 10,
      });

      if (customers.data.length === 0) {
        console.log('❌ No customer found with email:', email);
        return NextResponse.json({ subscriptions: [] });
      }

      // Get subscriptions for all matching customers
      for (const customer of customers.data) {
        console.log('👤 Found customer:', customer.id);
        const customerSubscriptions = await connectedStripe.subscriptions.list({
          customer: customer.id,
          limit: 100,
          expand: ['data.customer', 'data.items.data.price', 'data.latest_invoice'],
        });
        subscriptions = [...subscriptions, ...customerSubscriptions.data];
      }
    } else {
      // Get all subscriptions (admin view)
      console.log('🎯 Getting all subscriptions');
      const allSubscriptions = await connectedStripe.subscriptions.list({
        limit: 100,
        expand: ['data.customer', 'data.items.data.price', 'data.latest_invoice'],
      });
      subscriptions = allSubscriptions.data;
    }

    console.log(`✅ Found ${subscriptions.length} subscriptions`);

    // Format subscription data with type assertions
    const formattedSubscriptions = subscriptions.map(sub => {
      const subscriptionData = (sub as unknown) as {
        id: string;
        status: string;
        current_period_start: number;
        current_period_end: number;
        cancel_at_period_end: boolean;
        created: number;
        customer: any;
        items: any;
        latest_invoice: any;
        metadata: any;
      };

      return {
        id: subscriptionData.id,
        status: subscriptionData.status,
        current_period_start: subscriptionData.current_period_start,
        current_period_end: subscriptionData.current_period_end,
        cancel_at_period_end: subscriptionData.cancel_at_period_end,
        created: subscriptionData.created,

      customer: subscriptionData.customer ? {
        id: typeof subscriptionData.customer === 'string' ? subscriptionData.customer : subscriptionData.customer.id,
        email: typeof subscriptionData.customer === 'object' && subscriptionData.customer.email ? subscriptionData.customer.email : 'N/A',
        name: typeof subscriptionData.customer === 'object' && subscriptionData.customer.name ? subscriptionData.customer.name : 'N/A',
      } : null,

      items: subscriptionData.items.data.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price ? {
          id: item.price.id,
          unit_amount: item.price.unit_amount,
          currency: item.price.currency,
          recurring: item.price.recurring ? {
            interval: item.price.recurring.interval,
            interval_count: item.price.recurring.interval_count,
          } : null,
          product: item.price.product,
        } : null,
      })),

      latest_invoice: subscriptionData.latest_invoice ? {
        id: subscriptionData.latest_invoice.id,
        status: subscriptionData.latest_invoice.status,
        total: subscriptionData.latest_invoice.total,
        currency: subscriptionData.latest_invoice.currency,
        hosted_invoice_url: (subscriptionData.latest_invoice as Stripe.Invoice).hosted_invoice_url,
      } : null,

      amount: subscriptionData.items.data.reduce((total: number, item: any) => {
        return total + (item.price?.unit_amount || 0) * (item.quantity || 1);
      }, 0),

      metadata: subscriptionData.metadata,
      };
    });

    // Sort by creation date (newest first)
    formattedSubscriptions.sort((a, b) => b.created - a.created);

    console.log('✅ Successfully formatted subscriptions');
    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      total: formattedSubscriptions.length,
    });

  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}