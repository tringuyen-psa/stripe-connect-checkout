'use client';

import { useState, useEffect } from 'react';
import ShopifyCard from './ShopifyCard';
import ShopifyButton from './ShopifyButton';

interface SubscriptionItem {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  created: number;
  amount: number;
  customer: {
    id: string;
    email: string;
    name: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: {
      id: string;
      unit_amount: number;
      currency: string;
      recurring: {
        interval: string;
        interval_count: number;
      } | null;
      product: string | Stripe.Product;
    } | null;
  }>;
  latest_invoice: {
    id: string;
    status: string;
    total: number;
    currency: string;
    hosted_invoice_url: string | null;
  } | null;
  metadata: Record<string, string>;
}

interface SubscriptionListProps {
  email?: string;
  customerId?: string;
  showAll?: boolean;
}

export default function SubscriptionList({ email, customerId, showAll = false }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [email, customerId, showAll]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (customerId) params.append('customer_id', customerId);
      if (showAll) params.append('show_all', 'true');

      console.log('🔍 Fetching subscriptions with params:', params.toString());

      const response = await fetch(`/api/subscriptions?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscriptions');
      }

      console.log('✅ Subscriptions fetched:', data.total);
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('❌ Error fetching subscriptions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'incomplete':
        return 'bg-gray-100 text-gray-800';
      case 'incomplete_expired':
        return 'bg-red-100 text-red-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢 Active';
      case 'trialing':
        return '🔵 Trial';
      case 'past_due':
        return '🟡 Past Due';
      case 'canceled':
        return '🔴 Canceled';
      case 'incomplete':
        return '⚪ Incomplete';
      case 'incomplete_expired':
        return '🔴 Expired';
      case 'unpaid':
        return '🔴 Unpaid';
      default:
        return status;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBillingInterval = (item: SubscriptionItem['items'][0]) => {
    if (!item.price?.recurring) return 'N/A';
    const { interval, interval_count } = item.price.recurring;
    return interval_count === 1 ? interval : `${interval_count} ${interval}s`;
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const handleCancelSubscription = async (subscriptionId: string, immediate: boolean = false) => {
    if (!confirm(`Are you sure you want to ${immediate ? 'cancel immediately' : 'cancel at period end'} this subscription?`)) {
      return;
    }

    try {
      setCancelling(subscriptionId);
      console.log('🔴 Canceling subscription:', subscriptionId);

      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          immediate,
          reason: 'Customer requested cancellation via dashboard',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      console.log('✅ Subscription canceled successfully');

      // Update the subscription in the list
      setSubscriptions(prev => prev.map(sub =>
        sub.id === subscriptionId
          ? { ...sub, ...data.subscription }
          : sub
      ));

      alert('Subscription canceled successfully!');
    } catch (error) {
      console.error('❌ Error canceling subscription:', error);
      alert(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b6c8a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ShopifyCard>
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Subscriptions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <ShopifyButton onClick={fetchSubscriptions}>
            Try Again
          </ShopifyButton>
        </div>
      </ShopifyCard>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <ShopifyCard>
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscriptions Found</h3>
          <p className="text-gray-600">
            {showAll
              ? 'No subscriptions found in the system.'
              : 'No subscriptions found for this customer.'
            }
          </p>
        </div>
      </ShopifyCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {showAll ? 'All Subscriptions' : 'Your Subscriptions'} ({subscriptions.length})
        </h2>
        <ShopifyButton onClick={fetchSubscriptions} variant="outline" size="sm">
          🔄 Refresh
        </ShopifyButton>
      </div>

      <div className="grid gap-4">
        {subscriptions.map((subscription) => (
          <ShopifyCard key={subscription.id}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                      {getStatusText(subscription.status)}
                    </span>
                    {subscription.cancel_at_period_end && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ⚠️ Cancels at period end
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Subscription ID: <span className="font-mono">{subscription.id}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatAmount(subscription.amount, subscription.items[0]?.price?.currency || 'usd')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getBillingInterval(subscription.items[0])}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {subscription.customer && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {subscription.customer.name || 'Unknown Customer'}
                      </p>
                      <p className="text-sm text-gray-600">{subscription.customer.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Period */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Current Period</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Started</p>
                  <p className="text-sm text-gray-900">{formatDate(subscription.created)}</p>
                </div>
              </div>

              {/* Latest Invoice */}
              {subscription.latest_invoice && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Latest Invoice: {subscription.latest_invoice.id}
                      </p>
                      <p className="text-sm text-blue-700">
                        Status: {subscription.latest_invoice.status} • {formatAmount(subscription.latest_invoice.total, subscription.latest_invoice.currency)}
                      </p>
                    </div>
                    {subscription.latest_invoice.hosted_invoice_url && (
                      <ShopifyButton
                        onClick={() => window.open(subscription.latest_invoice!.hosted_invoice_url, '_blank')}
                        variant="outline"
                        size="sm"
                      >
                        📄 View Invoice
                      </ShopifyButton>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <ShopifyButton
                  onClick={() => window.open(`https://dashboard.stripe.com/subscriptions/${subscription.id}`, '_blank')}
                  variant="outline"
                  size="sm"
                >
                  📊 View in Stripe
                </ShopifyButton>

                {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                  <>
                    <ShopifyButton
                      onClick={() => handleCancelSubscription(subscription.id, false)}
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      disabled={cancelling === subscription.id}
                    >
                      {cancelling === subscription.id ? '⏳...' : '⏰ Cancel at Period End'}
                    </ShopifyButton>

                    <ShopifyButton
                      onClick={() => handleCancelSubscription(subscription.id, true)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      disabled={cancelling === subscription.id}
                    >
                      {cancelling === subscription.id ? '⏳...' : '🚨 Cancel Immediately'}
                    </ShopifyButton>
                  </>
                )}

                {subscription.latest_invoice?.hosted_invoice_url && (
                  <ShopifyButton
                    onClick={() => window.open(subscription.latest_invoice!.hosted_invoice_url!, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    📄 Latest Invoice
                  </ShopifyButton>
                )}
              </div>
            </div>
          </ShopifyCard>
        ))}
      </div>
    </div>
  );
}