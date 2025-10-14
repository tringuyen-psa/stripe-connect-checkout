'use client';

import { useState } from 'react';
import SubscriptionList from '@/components/SubscriptionList';
import ShopifyCard from '@/components/ShopifyCard';
import ShopifyInput from '@/components/ShopifyInput';
import ShopifyButton from '@/components/ShopifyButton';

export default function SubscriptionsPage() {
  const [activeView, setActiveView] = useState<'all' | 'by-email' | 'by-customer'>('all');
  const [email, setEmail] = useState('');
  const [customerId, setCustomerId] = useState('');

  const handleSearch = () => {
    if (!email && !customerId) {
      alert('Please enter an email or customer ID');
      return;
    }

    if (email) {
      setActiveView('by-email');
    } else if (customerId) {
      setActiveView('by-customer');
    }
  };

  const handleShowAll = () => {
    setActiveView('all');
    setEmail('');
    setCustomerId('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <svg
                className="h-6 w-6 text-green-600"
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
              <h1 className="text-xl font-bold text-gray-900">Subscription Management</h1>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm text-gray-600">Manage Subscriptions</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Section */}
        <ShopifyCard className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Subscriptions</h2>

          {/* View Toggle */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={handleShowAll}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeView === 'all'
                  ? 'bg-[#5b6c8a] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 All Subscriptions
            </button>
            <button
              onClick={() => setActiveView('by-email')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeView === 'by-email'
                  ? 'bg-[#5b6c8a] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📧 Search by Email
            </button>
            <button
              onClick={() => setActiveView('by-customer')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeView === 'by-customer'
                  ? 'bg-[#5b6c8a] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              👤 Search by Customer ID
            </button>
          </div>

          {/* Search Form */}
          {activeView === 'by-email' && (
            <div className="flex space-x-3">
              <div className="flex-1">
                <ShopifyInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter customer email..."
                  className="w-full"
                />
              </div>
              <ShopifyButton onClick={handleSearch}>
                🔍 Search
              </ShopifyButton>
            </div>
          )}

          {activeView === 'by-customer' && (
            <div className="flex space-x-3">
              <div className="flex-1">
                <ShopifyInput
                  type="text"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Enter customer ID (cus_xxx)..."
                  className="w-full"
                />
              </div>
              <ShopifyButton onClick={handleSearch}>
                🔍 Search
              </ShopifyButton>
            </div>
          )}

          {activeView === 'all' && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>📊 Admin View:</strong> Showing all subscriptions in the system. This view requires admin access to Stripe Connect account.
              </p>
            </div>
          )}
        </ShopifyCard>

        {/* Subscription List */}
        <SubscriptionList
          showAll={activeView === 'all'}
          email={activeView === 'by-email' ? email : undefined}
          customerId={activeView === 'by-customer' ? customerId : undefined}
        />

        {/* Quick Stats */}
        {activeView === 'all' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <ShopifyCard>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">💰</div>
                <div className="text-sm text-gray-600">Active Revenue</div>
              </div>
            </ShopifyCard>

            <ShopifyCard>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">👥</div>
                <div className="text-sm text-gray-600">Total Customers</div>
              </div>
            </ShopifyCard>

            <ShopifyCard>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">📈</div>
                <div className="text-sm text-gray-600">Monthly Growth</div>
              </div>
            </ShopifyCard>

            <ShopifyCard>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">⏰</div>
                <div className="text-sm text-gray-600">Avg. Lifetime</div>
              </div>
            </ShopifyCard>
          </div>
        )}

        {/* Help Section */}
        <ShopifyCard className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://dashboard.stripe.com/subscriptions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Stripe Dashboard</p>
                <p className="text-xs text-gray-600">Manage subscriptions in Stripe</p>
              </div>
            </a>

            <a
              href="/subscription-checkout"
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Create New Subscription</p>
                <p className="text-xs text-gray-600">Start a new subscription</p>
              </div>
            </a>
          </div>
        </ShopifyCard>
      </div>
    </div>
  );
}