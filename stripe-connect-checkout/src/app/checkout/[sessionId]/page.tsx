'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ShopifyEnhancedCheckout from '@/components/ShopifyEnhancedCheckout';
import { Product } from '@/types';


function CheckoutSessionPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is required');
      setLoading(false);
      return;
    }

    const fetchCheckoutSession = async () => {
      try {
        const response = await fetch(`/api/checkout?session_id=${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load checkout session');
        }

        // Extract product information from the session
        const lineItem = data.line_items?.data?.[0];
        if (lineItem) {
          setProduct({
            id: lineItem.price?.product,
            name: lineItem.description || 'Product',
            price: lineItem.amount_total / 100,
            currency: lineItem.currency,
          });
        } else {
          setError('No product found in checkout session');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load checkout session');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Checkout Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Unable to load checkout session'}</p>
            <button
              onClick={() => window.close()}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopifyEnhancedCheckout />
    </div>
  );
}

export default function CheckoutSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutSessionPageContent />
    </Suspense>
  );
}