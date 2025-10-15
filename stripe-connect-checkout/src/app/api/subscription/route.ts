import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONNECT_ACCOUNT_ID_TEST } from "@/lib/stripe-connect";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const {
      customerId,
      priceId,
      email,
      useConnectedAccount = false,
    } = await request.json();

    if (!customerId || !priceId) {
      return NextResponse.json(
        { error: "Customer ID and Price ID are required" },
        { status: 400 }
      );
    }

    let subscription: Stripe.Subscription;

    if (useConnectedAccount && STRIPE_CONNECT_ACCOUNT_ID_TEST) {
      // Create subscription cho Connected Account (Direct Charge)
      console.log("🎯 TẠO SUBSCRIPTION CHO CONNECTED ACCOUNT");
      console.log("👤 Customer:", customerId);
      console.log("💰 Price ID:", priceId);
      console.log("🏪 Connect Account:", STRIPE_CONNECT_ACCOUNT_ID_TEST);

      // Use test keys for development, main keys for production
      const isDevelopment = process.env.NODE_ENV !== "production";
      const secretKey = isDevelopment
        ? process.env.STRIPE_SECRET_KEY_TEST!
        : process.env.STRIPE_SECRET_KEY_MAIN!;

      const connectedStripe = new Stripe(secretKey, {
        apiVersion: "2025-09-30.clover",
        typescript: true,
        stripeAccount: STRIPE_CONNECT_ACCOUNT_ID_TEST,
      });

      subscription = await connectedStripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
          payment_method_types: ["card"],
        },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          connect_account: STRIPE_CONNECT_ACCOUNT_ID_TEST,
          customer_email: email || "",
        },
      });

      console.log("✅ Subscription tạo thành công cho Connected Account");
      console.log("📋 Subscription ID:", subscription.id);

      // For Connect accounts, we need to retrieve the latest invoice with payment_intent expanded
      const latestInvoice = (await connectedStripe.invoices.retrieve(
        (subscription.latest_invoice as string).toString(),
        { expand: ["payment_intent"] }
      )) as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent };

      console.log("🔗 Invoice ID:", latestInvoice.id);
      console.log(
        "🔗 Client Secret:",
        latestInvoice.payment_intent?.client_secret
      );
      console.log(
        "💸 Tiền subscription sẽ đi vào:",
        STRIPE_CONNECT_ACCOUNT_ID_TEST
      );
      console.log("=====================================");
    } else {
      // Create subscription thông thường
      console.log("🔹 TẠO SUBSCRIPTION THÔNG THƯỜNG");
      console.log("👤 Customer:", customerId);
      console.log("💰 Price ID:", priceId);

      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
          payment_method_types: ["card"],
        },
        expand: ["latest_invoice.payment_intent"],
        transfer_data: STRIPE_CONNECT_ACCOUNT_ID_TEST
          ? {
              destination: STRIPE_CONNECT_ACCOUNT_ID_TEST,
            }
          : undefined,
        metadata: {
          customer_email: email || "",
        },
      });

      console.log("✅ Subscription tạo thành công");
      console.log("📋 Subscription ID:", subscription.id);
      console.log("🔄 Transfer đến:", STRIPE_CONNECT_ACCOUNT_ID_TEST);
    }

    let clientSecret: string | undefined;

    if (useConnectedAccount && STRIPE_CONNECT_ACCOUNT_ID_TEST) {
      // Use the retrieved invoice from Connect account
      // Use test keys for development, main keys for production
      const isDevelopment = process.env.NODE_ENV !== "production";
      const secretKey = isDevelopment
        ? process.env.STRIPE_SECRET_KEY_TEST!
        : process.env.STRIPE_SECRET_KEY_MAIN!;

      const connectedStripe = new Stripe(secretKey, {
        apiVersion: "2025-09-30.clover",
        typescript: true,
        stripeAccount: STRIPE_CONNECT_ACCOUNT_ID_TEST,
      });

      console.log("🔍 Retrieving invoice from Connect account...");
      const invoiceId = (subscription.latest_invoice as string).toString();
      console.log("📋 Invoice ID:", invoiceId);

      try {
        const latestInvoice = (await connectedStripe.invoices.retrieve(
          invoiceId,
          {
            expand: ["payment_intent"],
          }
        )) as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent };

        console.log("📄 Invoice retrieved:", {
          id: latestInvoice.id,
          status: latestInvoice.status,
          payment_intent_id: latestInvoice.payment_intent?.id,
          payment_intent_status: latestInvoice.payment_intent?.status,
        });

        clientSecret = latestInvoice.payment_intent?.client_secret || undefined;
        console.log(
          "🔑 Connect Account Client Secret:",
          clientSecret ? "✅ Found" : "❌ Not found"
        );

        // If still no client secret, try to create a payment intent manually
        if (!clientSecret && latestInvoice.status === "open") {
          console.log(
            "🔄 Creating payment intent manually for open invoice..."
          );
          const paymentIntent = await connectedStripe.paymentIntents.create({
            amount: latestInvoice.amount_remaining || 0,
            currency: latestInvoice.currency,
            customer: subscription.customer as string,
            description: `Payment for subscription ${subscription.id}`,
            automatic_payment_methods: {
              enabled: true,
            },
            metadata: {
              subscription_id: subscription.id,
              invoice_id: latestInvoice.id,
            },
          });
          clientSecret = paymentIntent.client_secret || undefined;
          console.log(
            "🔑 Manual Payment Intent Client Secret:",
            clientSecret ? "✅ Created" : "❌ Failed"
          );
        }
      } catch (invoiceError) {
        console.error("❌ Error retrieving invoice:", invoiceError);
        // Fallback: create a new payment intent for the subscription
        console.log("🔄 Creating fallback payment intent...");
        const paymentIntent = await connectedStripe.paymentIntents.create({
          amount: Math.round(
            (subscription.items.data[0]?.price?.unit_amount || 0) *
              (subscription.items.data[0]?.quantity || 1)
          ),
          currency: subscription.items.data[0]?.price?.currency || "usd",
          customer: subscription.customer as string,
          description: `Subscription payment for ${subscription.id}`,
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            subscription_id: subscription.id,
          },
        });
        clientSecret = paymentIntent.client_secret || undefined;
        console.log(
          "🔑 Fallback Payment Intent Client Secret:",
          clientSecret ? "✅ Created" : "❌ Failed"
        );
      }
    } else {
      // Use regular subscription invoice
      const invoiceWithPayment =
        subscription.latest_invoice as Stripe.Invoice & {
          payment_intent?: Stripe.PaymentIntent;
        };
      clientSecret = invoiceWithPayment.payment_intent?.client_secret || undefined;
      console.log(
        "🔑 Regular Account Client Secret:",
        clientSecret ? "✅ Found" : "❌ Not found"
      );
    }

    console.log(
      "🔑 Final Client Secret:",
      clientSecret ? "✅ Available" : "❌ Missing"
    );

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: clientSecret,
      customerId: subscription.customer,
      status: subscription.status,
      connectedAccountId: useConnectedAccount
        ? STRIPE_CONNECT_ACCOUNT_ID_TEST
        : null,
      chargeType: useConnectedAccount ? "direct" : "transfer",
    });
  } catch (error) {
    console.error("❌ Error creating subscription:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create subscription",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get("subscription_id");

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Retrieving subscription:", subscriptionId);

    // Sử dụng Connect Stripe instance để retrieve subscription
    if (STRIPE_CONNECT_ACCOUNT_ID_TEST) {
      // Use test keys for development, main keys for production
      const isDevelopment = process.env.NODE_ENV !== "production";
      const secretKey = isDevelopment
        ? process.env.STRIPE_SECRET_KEY_TEST!
        : process.env.STRIPE_SECRET_KEY_MAIN!;

      const connectedStripe = new Stripe(secretKey, {
        apiVersion: "2025-09-30.clover",
        typescript: true,
        stripeAccount: STRIPE_CONNECT_ACCOUNT_ID_TEST,
      });

      const subscription = (await connectedStripe.subscriptions.retrieve(
        subscriptionId,
        {
          expand: ["customer", "latest_invoice", "items.data.price"],
        }
      )) as Stripe.Subscription;

      console.log(
        "✅ Successfully retrieved subscription from Connect account"
      );
      console.log("📋 Subscription ID:", subscription.id);
      console.log("📋 Subscription Status:", subscription.status);

      return NextResponse.json(subscription);
    } else {
      // Fallback: dùng stripe instance chính
      const subscription = (await stripe.subscriptions.retrieve(
        subscriptionId,
        {
          expand: ["customer", "latest_invoice", "items.data.price"],
        }
      )) as Stripe.Subscription;

      return NextResponse.json(subscription);
    }
  } catch (error) {
    console.error("❌ Subscription API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
