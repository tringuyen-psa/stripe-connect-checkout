'use client';

import { CartItem, ShippingOption, OrderSummary } from '@/types/checkout';
import ShopifyCard from './ShopifyCard';

interface ShopifyCartSummaryProps {
  items: CartItem[];
  selectedShipping: ShippingOption | null;
  orderSummary: OrderSummary;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export default function ShopifyCartSummary({
  items,
  selectedShipping,
  orderSummary,
  onQuantityChange,
  onRemoveItem
}: ShopifyCartSummaryProps) {
  return (
    <ShopifyCard className="sticky top-4">
      <div className="space-y-6">
        {/* Cart Items */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cart Summary</h3>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-b-0">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                  {item.variant && (
                    <p className="text-xs text-gray-500 mt-1">{item.variant}</p>
                  )}
                  <p className="text-sm text-gray-900 mt-1">${item.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="px-3 py-1 text-sm border-l border-r border-gray-300">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">${orderSummary.subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-900">
              {selectedShipping ? `$${selectedShipping.price.toFixed(2)}` : '—'}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="text-gray-900">${orderSummary.tax.toFixed(2)}</span>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-base font-semibold text-gray-900">
              ${orderSummary.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Promo Code */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Discount code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5b6c8a] focus:border-transparent"
            />
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5b6c8a]">
              Apply
            </button>
          </div>
        </div>
      </div>
    </ShopifyCard>
  );
}