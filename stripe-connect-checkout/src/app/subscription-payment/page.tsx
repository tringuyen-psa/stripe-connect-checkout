'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import SubscriptionPaymentForm from '@/components/SubscriptionPaymentForm';
import ShopifyCard from '@/components/ShopifyCard';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function SubscriptionPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientSecret = searchParams.get('client_secret');
  const subscriptionId = searchParams.get('subscription_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientSecret || !subscriptionId) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    console.log('🔍 Loading subscription payment');
    console.log('📋 Subscription ID:', subscriptionId);
    console.log('🔑 Client Secret:', clientSecret.substring(0, 20) + '...');
    setLoading(false);
  }, [clientSecret, subscriptionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b6c8a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <ShopifyCard>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.back()}
                className="w-full bg-[#5b6c8a] text-white px-4 py-2 rounded-md hover:bg-[#4a5a79]"
              >
                Go Back
              </button>
            </div>
          </ShopifyCard>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret: clientSecret!,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#5b6c8a',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Complete Subscription</h1>
            <div className="flex items-center space-x-2">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm text-gray-600">Recurring Payment</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Subscription Info */}
        <div className="mb-8">
          <ShopifyCard>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Subscription</h2>
              <p className="text-gray-600">
                Enter your payment details to activate your recurring subscription.
              </p>
            </div>
          </ShopifyCard>
        </div>

        {/* Payment Form */}
        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <SubscriptionPaymentForm subscriptionId={subscriptionId!} />
          </Elements>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b6c8a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SubscriptionPaymentContent />
    </Suspense>
  );
}