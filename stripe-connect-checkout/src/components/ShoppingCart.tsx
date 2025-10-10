'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import ShopifyButton from './ShopifyButton';
import { CartItem } from '@/types/checkout';

export default function ShoppingCart() {
  const { cart, setIsCartOpen, updateQuantity, removeFromCart } = useCart();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    setIsUpdating(itemId);
    updateQuantity(itemId, newQuantity);
    setTimeout(() => setIsUpdating(null), 300);
  };

  const handleRemoveItem = (itemId: string) => {
    setIsUpdating(itemId);
    removeFromCart(itemId);
    setTimeout(() => setIsUpdating(null), 300);
  };

  const handleCheckout = () => {
    // Navigate to checkout page
    window.location.href = '/checkout';
  };

  if (cart.items.length === 0) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={() => setIsCartOpen(false)} />

          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <p className="text-sm text-gray-400 mb-6">Add some products to get started!</p>
                <ShopifyButton onClick={() => setIsCartOpen(false)}>
                  Continue Shopping
                </ShopifyButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center p-4 sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsCartOpen(false)} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full sm:max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="max-h-96 overflow-y-auto">
            {cart.items.map((item: CartItem) => (
              <div key={item.id} className="p-6 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={isUpdating === item.id}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="px-3 py-1 text-sm border-l border-r border-gray-300 min-w-[3rem] text-center">
                        {isUpdating === item.id ? '...' : item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={isUpdating === item.id}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    <div className="text-right min-w-[5rem]">
                      <p className="text-sm font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isUpdating === item.id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">Calculated at checkout</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-base font-semibold text-gray-900">${cart.subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <ShopifyButton
                onClick={handleCheckout}
                className="w-full"
                size="lg"
              >
                Proceed to Checkout
              </ShopifyButton>

              <ShopifyButton
                onClick={() => setIsCartOpen(false)}
                variant="outline"
                className="w-full"
              >
                Continue Shopping
              </ShopifyButton>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Free shipping on orders over $50
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}