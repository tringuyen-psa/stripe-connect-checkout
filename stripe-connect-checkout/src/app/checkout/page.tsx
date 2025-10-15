'use client';

import ShoppingCart from '@/components/ShoppingCart';

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">☕ Thanh Toán</h1>
        <ShoppingCart />
      </div>
    </div>
  );
}