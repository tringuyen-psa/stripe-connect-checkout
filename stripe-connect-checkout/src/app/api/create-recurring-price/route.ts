import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONNECT_ACCOUNT_ID_TEST } from "@/lib/stripe-connect";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      currency = "usd",
      interval = "month", // month | year | week | day
      intervalCount = 1, // Số interval giữa các charge
      productId,
      nickname,
      useConnectedAccount = false,
    } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    let price: Stripe.Price;

    if (useConnectedAccount && STRIPE_CONNECT_ACCOUNT_ID_TEST) {
      // Create recurring price cho Connected Account (Direct Charge)
      console.log("🎯 TẠO RECURRING PRICE CHO CONNECTED ACCOUNT");
      console.log("💰 Amount:", amount + " " + currency + "/" + interval);
      console.log("🔄 Interval:", intervalCount + " " + interval + "(s)");
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

      // Nếu không có productId, tạo product mới
      let finalProductId = productId;
      if (!finalProductId) {
        const product = await connectedStripe.products.create({
          name: `Subscription Service - $${amount.toFixed(2)}/${interval}`,
          description: `Recurring payment of $${amount.toFixed(2)} every ${intervalCount} ${interval}(s)`,
          metadata: {
            connect_account: STRIPE_CONNECT_ACCOUNT_ID_TEST,
            subscription_type: "recurring",
            amount: amount.toString(),
            currency: currency,
            interval: interval,
          },
        });
        finalProductId = product.id;
        console.log("📦 Created new product:", product.id);
      }

      price = await connectedStripe.prices.create({
        currency,
        unit_amount: Math.round(amount * 100), // Convert to cents
        recurring: {
          interval: interval as Stripe.Price.Recurring.Interval,
          interval_count: intervalCount,
        },
        product: finalProductId,
        nickname: nickname || `Monthly $${amount.toFixed(2)} Subscription`,
        metadata: {
          connect_account: STRIPE_CONNECT_ACCOUNT_ID_TEST,
          subscription_type: "recurring",
          original_amount: amount.toString(),
        },
      });

      console.log("✅ Recurring price tạo thành công cho Connected Account");
      console.log("📋 Price ID:", price.id);
      console.log("📦 Product ID:", price.product);
      console.log("💵 Amount:", price.unit_amount! / 100 + " " + currency);
      console.log(
        "🔄 Recurring:",
        price.recurring?.interval_count +
          " " +
          price.recurring?.interval +
          "(s)"
      );
      console.log(
        "💸 Tiền subscription sẽ đi vào:",
        STRIPE_CONNECT_ACCOUNT_ID_TEST
      );
      console.log("=====================================");
    } else {
      // Create recurring price thông thường
      console.log("🔹 TẠO RECURRING PRICE THÔNG THƯỜNG");
      console.log("💰 Amount:", amount + " " + currency + "/" + interval);

      // Nếu không có productId, tạo product mới
      let finalProductId = productId;
      if (!finalProductId) {
        const product = await stripe.products.create({
          name: `Subscription Service - $${amount.toFixed(2)}/${interval}`,
          description: `Recurring payment of $${amount.toFixed(2)} every ${intervalCount} ${interval}(s)`,
          metadata: {
            subscription_type: "recurring",
            amount: amount.toString(),
            currency: currency,
            interval: interval,
          },
        });
        finalProductId = product.id;
        console.log("📦 Created new product:", product.id);
      }

      price = await stripe.prices.create({
        currency,
        unit_amount: Math.round(amount * 100), // Convert to cents
        recurring: {
          interval: interval as Stripe.Price.Recurring.Interval,
          interval_count: intervalCount,
        },
        product: finalProductId,
        nickname: nickname || `Monthly $${amount.toFixed(2)} Subscription`,
        metadata: {
          subscription_type: "recurring",
          original_amount: amount.toString(),
        },
      });

      console.log("✅ Recurring price tạo thành công");
      console.log("📋 Price ID:", price.id);
      console.log("🔄 Transfer đến:", STRIPE_CONNECT_ACCOUNT_ID_TEST);
    }

    return NextResponse.json({
      priceId: price.id,
      productId: price.product,
      amount: price.unit_amount! / 100,
      currency: price.currency,
      recurring: price.recurring,
      nickname: price.nickname,
      connectedAccountId: useConnectedAccount
        ? STRIPE_CONNECT_ACCOUNT_ID_TEST
        : null,
      chargeType: useConnectedAccount ? "direct" : "transfer",
    });
  } catch (error) {
    console.error("❌ Error creating recurring price:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create recurring price",
      },
      { status: 500 }
    );
  }
}
