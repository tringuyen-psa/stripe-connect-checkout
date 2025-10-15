'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
  id: string;
  name: string;
  basePrice: number;
  description: string;
  image: string;
  features: string[];
}

interface PurchasedProduct {
  id: string;
  name: string;
  price: number;
  plan: string;
  purchaseDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'cancelled';
}

const products: Product[] = [
  {
    id: '1',
    name: 'Premium Software',
    basePrice: 29.99,
    description: 'Professional software solution for businesses',
    image: '💻',
    features: ['Unlimited users', '24/7 support', 'Cloud storage', 'Advanced analytics']
  },
  {
    id: '2',
    name: 'Marketing Suite',
    basePrice: 49.99,
    description: 'Complete marketing automation platform',
    image: '📈',
    features: ['Email campaigns', 'Social media tools', 'Analytics dashboard', 'A/B testing']
  },
  {
    id: '3',
    name: 'E-commerce Platform',
    basePrice: 79.99,
    description: 'Full-featured online store solution',
    image: '🛒',
    features: ['Product catalog', 'Payment processing', 'Inventory management', 'Mobile app']
  }
];

const plans = [
  { name: 'monthly', label: 'Monthly', multiplier: 1, discount: 0 },
  { name: 'weekly', label: 'Weekly', multiplier: 0.3, discount: 0 },
  { name: 'yearly', label: 'Yearly', multiplier: 10, discount: 0.2 }
];

export default function Home() {
  const [selectedProducts, setSelectedProducts] = useState<Array<{product: Product; plan: typeof plans[0]; quantity: number}>>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate fetching purchased products from API
    const fetchPurchasedProducts = async () => {
      try {
        const response = await axios.get('/api/purchased-products');
        setPurchasedProducts(response.data);
      } catch (error) {
        console.log('No purchased products yet');
      }
    };
    fetchPurchasedProducts();
  }, []);

  const addToCart = (product: Product, plan: typeof plans[0]) => {
    const existingIndex = selectedProducts.findIndex(
      p => p.product.id === product.id && p.plan.name === plan.name
    );

    if (existingIndex >= 0) {
      const updated = [...selectedProducts];
      updated[existingIndex].quantity += 1;
      setSelectedProducts(updated);
    } else {
      setSelectedProducts([...selectedProducts, { product, plan, quantity: 1 }]);
    }
  };

  const removeFromCart = (index: number) => {
    const updated = [...selectedProducts];
    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1;
    } else {
      updated.splice(index, 1);
    }
    setSelectedProducts(updated);
  };

  const getTotalPrice = () => {
    return selectedProducts.reduce((total, { product, plan, quantity }) => {
      const monthlyPrice = product.basePrice * plan.multiplier;
      const discountedPrice = monthlyPrice * (1 - plan.discount);
      return total + (discountedPrice * quantity);
    }, 0);
  };

  const handleCheckout = () => {
    if (selectedProducts.length === 0) return;
    setShowCheckout(true);
  };

  const handlePaymentSuccess = async (sessionId: string) => {
    setLoading(true);
    try {
      // Call API to save purchase
      await axios.post('/api/save-purchase', {
        sessionId,
        products: selectedProducts.map(({ product, plan, quantity }) => ({
          productId: product.id,
          productName: product.name,
          price: product.basePrice * plan.multiplier * (1 - plan.discount),
          plan: plan.name,
          quantity
        }))
      });

      // Reset cart and refresh purchased products
      setSelectedProducts([]);
      const response = await axios.get('/api/purchased-products');
      setPurchasedProducts(response.data);
      setShowCheckout(false);
    } catch (error) {
      console.error('Error saving purchase:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Digital Store</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowCheckout(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 relative"
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
                  {selectedProducts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Purchased Products Section */}
        {purchasedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedProducts.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.plan}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.status === 'active' ? 'bg-green-100 text-green-800' :
                      item.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Price:</span> ${item.price.toFixed(2)}</p>
                    <p><span className="font-medium">Purchased:</span> {new Date(item.purchaseDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">Expires:</span> {new Date(item.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Products Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-4xl mr-3">{product.image}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.description}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-2xl font-bold text-gray-900">${product.basePrice.toFixed(2)}
                      <span className="text-sm font-normal text-gray-600">/month</span>
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Choose Plan:</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {plans.map((plan) => {
                        const monthlyPrice = product.basePrice * plan.multiplier;
                        const discountedPrice = monthlyPrice * (1 - plan.discount);
                        const isInCart = selectedProducts.some(
                          p => p.product.id === product.id && p.plan.name === plan.name
                        );

                        return (
                          <button
                            key={plan.name}
                            onClick={() => addToCart(product, plan)}
                            className={`text-xs p-2 rounded-lg border ${
                              isInCart
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium">{plan.label}</div>
                            <div className="text-xs">
                              {plan.discount > 0 && (
                                <span className="line-through text-gray-400">${monthlyPrice.toFixed(2)}</span>
                              )}
                              <span className="font-bold">${discountedPrice.toFixed(2)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                {selectedProducts.map(({ product, plan, quantity }, index) => (
                  <div key={`${product.id}-${plan.name}`} className="flex justify-between items-center py-2">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-600">{plan.label} × {quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${(product.basePrice * plan.multiplier * (1 - plan.discount) * quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-bold text-xl">${getTotalPrice().toFixed(2)}</span>
                </div>

                <button
                  onClick={() => {/* Handle payment gateway selection */}}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>

            <div className="p-6 border-t">
              <button
                onClick={() => setShowCheckout(false)}
                className="w-full text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
