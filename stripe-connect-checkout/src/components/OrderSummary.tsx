'use client';

import ShopifyCard from './ShopifyCard';
import ShopifyButton from './ShopifyButton';
import { CartItem } from '@/types/checkout';

export interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency?: string;
  showCheckoutButton?: boolean;
  onCheckoutClick?: () => void;
  isProcessing?: boolean;
  checkoutButtonText?: string;
}

export default function OrderSummary({
  items,
  subtotal,
  shipping,
  tax,
  total,
  currency = 'USD',
  showCheckoutButton = false,
  onCheckoutClick,
  isProcessing = false,
  checkoutButtonText = 'Complete Order'
}: OrderSummaryProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const totalSavings = 0; // Could implement discount logic later

  return (
    <ShopifyCard>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

      {/* Items List */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </h4>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium text-gray-900">
            {shipping === 0 ? 'Free' : formatPrice(shipping)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
        </div>

        {totalSavings > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Total Savings</span>
            <span className="font-medium">-{formatPrice(totalSavings)}</span>
          </div>
        )}

        <div className="flex justify-between pt-3 border-t border-gray-200">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-base font-semibold text-gray-900">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {/* Promo Code */}
      <div className="mt-6">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Discount code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5b6c8a] focus:border-transparent text-sm"
          />
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5b6c8a]"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Checkout Button */}
      {showCheckoutButton && (
        <div className="mt-6">
          <ShopifyButton
            onClick={onCheckoutClick}
            disabled={isProcessing || items.length === 0}
            className="w-full"
            size="lg"
          >
            {isProcessing ? 'Processing...' : checkoutButtonText}
          </ShopifyButton>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure checkout powered by Stripe</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>All major credit cards accepted</span>
            </div>
          </div>
        </div>
      )}

      {/* Free Shipping Banner */}
      {subtotal < 50 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-yellow-800">
              Add {formatPrice(50 - subtotal)} more for free shipping!
            </p>
          </div>
        </div>
      )}

      {subtotal >= 50 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs text-green-800">
              You&apos;ve earned free shipping! 🎉
            </p>
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>SSL Secured</span>
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Safe Payment</span>
            </div>
          </div>
        </div>
      </div>
    </ShopifyCard>
  );
}