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
    // Create a product in Stripe
    const product = await stripe.products.create({
      name,
      description,
      type: 'service',
    });

    // Create a price for the product
    const priceData = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100), // Convert to cents
      currency,
    });

    // Create a checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceData.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      metadata: {
        product_id: product.id,
        product_name: name,
      },
    };

    // Only add transfer_data if it's a different account
    if (STRIPE_CONNECT_ACCOUNT_ID && STRIPE_CONNECT_ACCOUNT_ID !== 'acct_1SE01SGvqAVA71Vq') {
      sessionConfig.payment_intent_data = {
        transfer_data: {
          destination: STRIPE_CONNECT_ACCOUNT_ID,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return {
      success: true,
      data: {
        sessionId: session.id,
        checkoutUrl: session.url!,
        product: {
          id: product.id,
          name,
          price,
          currency,
          description,
        },
      },
    };
  } catch (error) {
    console.error('Stripe error:', error);
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