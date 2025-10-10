'use client';

import ProductInput from '@/components/ProductInput';
import ShoppingCart from '@/components/ShoppingCart';
import { useCart } from '@/hooks/useCart';

export default function Home() {
  const { isCartOpen } = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Shopify Checkout Pro</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Cart Indicator */}
              <div className="relative">
                <CartIndicator />
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
                <span className="text-sm text-gray-600">Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <ProductInput />
      </main>

      {/* Shopping Cart Modal */}
      {isCartOpen && <ShoppingCart />}
    </div>
  );
}

function CartIndicator() {
  const { cart, setIsCartOpen } = useCart();

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
    >
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>

      {cart.itemCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#5b6c8a] text-white rounded-full flex items-center justify-center text-xs font-medium">
          {cart.itemCount > 99 ? '99+' : cart.itemCount}
        </span>
      )}
    </button>
  );
}
