'use client';

import { useState, useEffect } from 'react';
import ShopifyCard from '@/components/ShopifyCard';
import ShopifyButton from '@/components/ShopifyButton';

interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  plan?: {
    amount: number;
    currency: string;
    interval: string;
    interval_count: number;
  };
  customer?: {
    email: string;
    name: string;
  };
}

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch subscriptions from your API
    // For now, we'll show a placeholder dashboard
    setLoading(false);
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Subscription Dashboard</h1>
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
              <span className="text-sm text-gray-600">Manage Subscriptions</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <ShopifyCard>
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Your Dashboard</h2>
              <p className="text-gray-600 mb-6">
                Manage your subscriptions and track recurring payments here.
              </p>

              <div className="flex justify-center space-x-4">
                <ShopifyButton onClick={() => window.location.href = '/'}>
                  🛍️ Create New Subscription
                </ShopifyButton>
                <ShopifyButton
                  variant="outline"
                  onClick={() => window.location.href = '/subscription-checkout'}
                >
                  💳 View Active Subscriptions
                </ShopifyButton>
              </div>
            </div>
          </ShopifyCard>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ShopifyCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Active Subscriptions</div>
            </div>
          </ShopifyCard>

          <ShopifyCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">$0.00</div>
              <div className="text-sm text-gray-600">Monthly Revenue</div>
            </div>
          </ShopifyCard>

          <ShopifyCard>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Total Customers</div>
            </div>
          </ShopifyCard>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ShopifyCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Features</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Automatic Billing</h4>
                  <p className="text-sm text-gray-600">Customers are charged automatically on schedule</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Flexible Billing Cycles</h4>
                  <p className="text-sm text-gray-600">Weekly, monthly, or yearly billing options</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Customer Management</h4>
                  <p className="text-sm text-gray-600">Track and manage all your subscribers</p>
                </div>
              </div>
            </div>
          </ShopifyCard>

          <ShopifyCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Processing</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Secure Payments</h4>
                  <p className="text-sm text-gray-600">Powered by Stripe with PCI compliance</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Connect Integration</h4>
                  <p className="text-sm text-gray-600">Direct payments to your connected account</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Failed Payment Handling</h4>
                  <p className="text-sm text-gray-600">Automatic retry logic for failed payments</p>
                </div>
              </div>
            </div>
          </ShopifyCard>
        </div>
      </div>
    </div>
  );
}