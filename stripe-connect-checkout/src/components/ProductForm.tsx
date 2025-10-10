'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ProductInput, CheckoutSession } from '@/types';

type ProductFormData = {
  name: string;
  price: number;
  currency: string;
  description?: string;
};

interface ProductFormProps {
  onSubmit: (data: ProductInput) => Promise<{ success: boolean; error?: string; data?: CheckoutSession }>;
  loading?: boolean;
}

export default function ProductForm({ onSubmit, loading = false }: ProductFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    defaultValues: {
      currency: 'usd',
    },
  });

  const onFormSubmit = async (data: ProductFormData) => {
    setSubmitError(null);
    setSuccessUrl(null);

    try {
      const result = await onSubmit(data);

      if (result.success && result.data?.checkoutUrl) {
        setSuccessUrl(result.data.checkoutUrl);
        reset();
      } else {
        setSubmitError(result.error || 'Failed to create product');
      }
    } catch {
      setSubmitError('An unexpected error occurred');
    }
  };

  if (successUrl) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Checkout Link Created!</h2>
          <p className="text-gray-600 mb-4">Your product checkout page is ready</p>
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <p className="text-sm text-gray-500 truncate">{successUrl}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.open(successUrl, '_blank')}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Open Checkout
            </button>
            <button
              onClick={() => setSuccessUrl(null)}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Product</h2>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter product name"
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price ($) *
          </label>
          <input
            {...register('price', { valueAsNumber: true })}
            type="number"
            id="price"
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
            disabled={loading}
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            {...register('currency')}
            id="currency"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="usd">USD ($)</option>
            <option value="eur">EUR (€)</option>
            <option value="gbp">GBP (£)</option>
            <option value="cad">CAD ($)</option>
            <option value="aud">AUD ($)</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter product description"
            disabled={loading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Checkout Link'}
        </button>
      </form>
    </div>
  );
}