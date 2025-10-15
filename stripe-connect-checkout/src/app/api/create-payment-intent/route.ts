import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONNECT_ACCOUNT_ID_TEST } from "@/lib/stripe-connect";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      currency = "usd",
      useConnectedAccount = false,
    } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    let paymentIntent: Stripe.PaymentIntent;

    if (useConnectedAccount && STRIPE_CONNECT_ACCOUNT_ID_TEST) {
      // Create Payment Intent cho Connected Account (Direct Charge)
      console.log("🎯 TẠO PAYMENT INTENT CHO CONNECTED ACCOUNT");
      console.log("💰 Amount:", amount + " " + currency);
      console.log("🏪 Connect Account:", STRIPE_CONNECT_ACCOUNT_ID_TEST);

      // Tạo Stripe instance với Connected Account
      const connectedStripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST!, {
        apiVersion: "2025-09-30.clover",
        typescript: true,
        stripeAccount: STRIPE_CONNECT_ACCOUNT_ID_TEST,
      });

      paymentIntent = await connectedStripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        // KHÔNG cần transfer_data vì đây là Direct Charge
        // Tiền đi thẳng vào Connected Account
      });

      console.log("✅ Payment Intent tạo thành công cho Connected Account");
      console.log("📋 Payment Intent ID:", paymentIntent.id);
      console.log("🔗 Client Secret:", paymentIntent.client_secret);
      console.log("💸 Tiền sẽ đi thẳng vào:", STRIPE_CONNECT_ACCOUNT_ID_TEST);
      console.log("=====================================");
    } else {
      // Create Payment Intent thông thường cho account chính
      console.log("🔹 TẠO PAYMENT INTENT THÔNG THƯỜNG");
      console.log("💰 Amount:", amount + " " + currency);

      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        transfer_data: STRIPE_CONNECT_ACCOUNT_ID_TEST
          ? {
              destination: STRIPE_CONNECT_ACCOUNT_ID_TEST,
            }
          : undefined,
      });

      console.log("✅ Payment Intent tạo thành công với transfer");
      console.log("📋 Payment Intent ID:", paymentIntent.id);
      console.log("🔄 Transfer đến:", STRIPE_CONNECT_ACCOUNT_ID_TEST);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      connectedAccountId: useConnectedAccount
        ? STRIPE_CONNECT_ACCOUNT_ID_TEST
        : null,
      chargeType: useConnectedAccount ? "direct" : "transfer",
    });
  } catch (error) {
    console.error("❌ Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
