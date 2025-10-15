import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONNECT_ACCOUNT_ID_TEST } from "@/lib/stripe-connect";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      name,
      phone,
      address,
      useConnectedAccount = false,
    } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    let customer: Stripe.Customer;

    if (useConnectedAccount && STRIPE_CONNECT_ACCOUNT_ID_TEST) {
      // Create customer cho Connected Account (Direct Charge)
      console.log("🎯 TẠO CUSTOMER CHO CONNECTED ACCOUNT");
      console.log("📧 Email:", email);
      console.log("👤 Name:", name);
      console.log("🏪 Connect Account:", STRIPE_CONNECT_ACCOUNT_ID_TEST);

      const connectedStripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST!, {
        apiVersion: "2025-09-30.clover",
        typescript: true,
        stripeAccount: STRIPE_CONNECT_ACCOUNT_ID_TEST,
      });

      customer = await connectedStripe.customers.create({
        email,
        name,
        phone: phone || undefined,
        address: address
          ? {
              line1: address.address,
              line2: address.apartment || undefined,
              city: address.city,
              state: address.state || undefined,
              postal_code: address.postalCode,
              country: address.country || "US",
            }
          : undefined,
        metadata: {
          connect_account: STRIPE_CONNECT_ACCOUNT_ID_TEST,
          source: "checkout_subscription",
        },
      });

      console.log("✅ Customer tạo thành công cho Connected Account");
      console.log("📋 Customer ID:", customer.id);
      console.log(
        "💸 Customer sẽ thuộc Connect Account:",
        STRIPE_CONNECT_ACCOUNT_ID_TEST
      );
      console.log("=====================================");
    } else {
      // Create customer thông thường
      console.log("🔹 TẠO CUSTOMER THÔNG THƯỜNG");
      console.log("📧 Email:", email);
      console.log("👤 Name:", name);

      customer = await stripe.customers.create({
        email,
        name,
        phone: phone || undefined,
        address: address
          ? {
              line1: address.address,
              line2: address.apartment || undefined,
              city: address.city,
              state: address.state || undefined,
              postal_code: address.postalCode,
              country: address.country || "US",
            }
          : undefined,
        metadata: {
          source: "checkout_subscription",
        },
      });

      console.log("✅ Customer tạo thành công");
      console.log("📋 Customer ID:", customer.id);
    }

    return NextResponse.json({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      connectedAccountId: useConnectedAccount
        ? STRIPE_CONNECT_ACCOUNT_ID_TEST
        : null,
      chargeType: useConnectedAccount ? "direct" : "transfer",
    });
  } catch (error) {
    console.error("❌ Error creating customer:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create customer",
      },
      { status: 500 }
    );
  }
}
