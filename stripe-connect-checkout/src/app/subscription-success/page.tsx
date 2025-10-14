'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ShopifyCard from '@/components/ShopifyCard';
import ShopifyButton from '@/components/ShopifyButton';

interface SubscriptionDetails {
  id?: string;
  status?: string;
  current_period_start?: number;
  current_period_end?: number;
  customer?: {
    email?: string;
    name?: string;
  };
  plan?: {
    amount?: number;
    currency?: string;
    interval?: string;
    interval_count?: number;
  };
}

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get('subscription_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);

  useEffect(() => {
    if (!subscriptionId) {
      setError('Subscription ID is required');
      setLoading(false);
      return;
    }

    const fetchSubscriptionDetails = async () => {
      try {
        const response = await fetch(`/api/subscription?subscription_id=${subscriptionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load subscription details');
        }

        setSubscriptionDetails(data);
        console.log('✅ Subscription details loaded:', data);
      } catch (err) {
        console.error('❌ Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [subscriptionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b6c8a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription details...</p>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <ShopifyButton
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Go to Homepage
              </ShopifyButton>
            </div>
          </ShopifyCard>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const nextBillingDate = subscriptionDetails?.current_period_end
    ? formatDate(subscriptionDetails.current_period_end)
    : 'Unknown';

  const planAmount = subscriptionDetails?.plan?.amount
    ? formatCurrency(subscriptionDetails.plan.amount, subscriptionDetails.plan.currency || 'usd')
    : 'Unknown';

  const billingCycle = subscriptionDetails?.plan?.interval_count === 1
    ? subscriptionDetails?.plan?.interval
    : `${subscriptionDetails?.plan?.interval_count} ${subscriptionDetails?.plan?.interval}s`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Subscription Active</h1>
            </div>
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="text-sm text-gray-600">Subscription Confirmed</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Subscription Activated!
          </h1>
          <p className="text-lg text-gray-600">
            Your recurring subscription has been successfully activated.
          </p>
        </div>

        {/* Subscription Details */}
        <ShopifyCard className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Subscription Details</h2>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Subscription ID</span>
              <span className="text-sm font-medium text-gray-900">{subscriptionId}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Billing Amount</span>
              <span className="text-sm font-medium text-gray-900">{planAmount}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Billing Cycle</span>
              <span className="text-sm font-medium text-gray-900">Every {billingCycle}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Next Billing Date</span>
              <span className="text-sm font-medium text-gray-900">{nextBillingDate}</span>
            </div>

            {subscriptionDetails?.customer?.email && (
              <div className="flex justify-between py-3">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm font-medium text-gray-900">{subscriptionDetails.customer.email}</span>
              </div>
            )}
          </div>
        </ShopifyCard>

        {/* What's Next */}
        <ShopifyCard className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What&apos;s Next?</h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-blue-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Confirmation Email</h3>
                <p className="text-sm text-gray-600">A confirmation email has been sent to your registered email address.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-blue-600 mt-0.5"
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
              <div>
                <h3 className="text-sm font-medium text-gray-900">Automatic Billing</h3>
                <p className="text-sm text-gray-600">You will be automatically charged {planAmount} every {billingCycle}.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-blue-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Manage Subscription</h3>
                <p className="text-sm text-gray-600">You can cancel or modify your subscription anytime from your account settings.</p>
              </div>
            </div>
          </div>
        </ShopifyCard>

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <ShopifyButton
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
            >
              📊 Go to Dashboard
            </ShopifyButton>
            <ShopifyButton
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-1"
            >
              🏠 Return Home
            </ShopifyButton>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              💡 <strong>Tip:</strong> Save your subscription ID for future reference: <code className="bg-gray-100 px-2 py-1 rounded">{subscriptionId}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b6c8a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}