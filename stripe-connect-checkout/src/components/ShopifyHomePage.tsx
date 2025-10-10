'use client';

import { useState } from 'react';
import ShopifyCard from './ShopifyCard';
import ShopifyButton from './ShopifyButton';
import ShopifyInput from './ShopifyInput';
import { ProductInput, CheckoutSession } from '@/types';

interface ShopifyHomePageProps {
  onSubmit: (data: ProductInput) => Promise<{ success: boolean; error?: string; data?: CheckoutSession }>;
}

export default function ShopifyHomePage({ onSubmit }: ShopifyHomePageProps) {
  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    price: 0,
    currency: 'usd',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<CheckoutSession | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.price <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onSubmit(formData);

      if (result.success && result.data) {
        setSuccess(result.data);
        setFormData({ name: '', price: 0, currency: 'usd', description: '' });
      } else {
        setError(result.error || 'Failed to create product');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <ShopifyCard>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg
                  className="h-8 w-8 text-green-600"
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Product Created Successfully!
              </h1>
              <p className="text-gray-600 mb-6">
                Your checkout link is ready to share
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">Checkout Link:</p>
                <p className="text-sm font-mono text-gray-900 break-all">
                  {success.checkoutUrl}
                </p>
              </div>

              <div className="space-y-3">
                <ShopifyButton
                  onClick={() => window.open(success.checkoutUrl, '_blank')}
                  className="w-full"
                >
                  Open Checkout Page
                </ShopifyButton>
                <ShopifyButton
                  variant="outline"
                  onClick={() => setSuccess(null)}
                  className="w-full"
                >
                  Create Another Product
                </ShopifyButton>
              </div>
            </div>
          </ShopifyCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Checkout Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Powered by Stripe</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Product
          </h1>
          <p className="text-xl text-gray-600">
            Set up your product and generate a secure checkout link in seconds
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <ShopifyCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <ShopifyInput
                id="name"
                label="Product Name"
                placeholder="Enter your product name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <ShopifyInput
                id="price"
                label="Price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b6c8a] focus:border-transparent"
              >
                <option value="usd">USD ($)</option>
                <option value="eur">EUR (€)</option>
                <option value="gbp">GBP (£)</option>
                <option value="cad">CAD ($)</option>
                <option value="aud">AUD ($)</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe your product..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5b6c8a] focus:border-transparent resize-none"
              />
            </div>

            <div className="pt-4">
              <ShopifyButton
                type="submit"
                loading={loading}
                disabled={loading || !formData.name || formData.price <= 0}
                className="w-full"
              >
                {loading ? 'Creating...' : 'Create Checkout Link'}
              </ShopifyButton>
            </div>
          </form>
        </ShopifyCard>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Fast Setup</h3>
            <p className="text-gray-600">Create products and checkout links in seconds</p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-gray-600">Powered by Stripe for secure payment processing</p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Global Reach</h3>
            <p className="text-gray-600">Accept payments from customers worldwide</p>
          </div>
        </div>
      </main>
    </div>
  );
}