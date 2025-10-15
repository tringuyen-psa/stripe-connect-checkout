'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import ShopifyCard from './ShopifyCard';
import ShopifyInput from './ShopifyInput';
import ShopifyButton from './ShopifyButton';

export default function ProductInput() {
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; price?: string; submit?: string }>({});
  const { addToCart } = useCart();

  const validateForm = () => {
    const newErrors: { name?: string; price?: string; submit?: string } = {};

    if (!productName || typeof productName !== 'string' || !productName.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!productPrice || typeof productPrice !== 'string' || !productPrice.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(productPrice)) || Number(productPrice) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateProduct = async () => {
    if (!validateForm()) return;

    setIsCreating(true);

    try {
      // Create simple product
      const product = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: typeof productName === 'string' ? productName.trim() : '',
        price: parseFloat(productPrice),
        currency: 'USD'
      };

      // Add product to cart
      addToCart(product);

      // Reset form
      setProductName('');
      setProductPrice('');
      setErrors({});

      console.log('🛒 Product added to cart:', product);

      // Navigate to checkout
      window.location.href = '/checkout';

    } catch (error) {
      console.error('Error adding product to cart:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to add product to cart' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Input Section */}
        <div>
          <ShopifyCard>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Product</h2>
            <p className="text-gray-600 mb-6">
              Create a product for your Shopify store and start selling.
            </p>

            <div className="space-y-4">
              <ShopifyInput
                label="Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
                error={errors.name}
                required
              />

              <ShopifyInput
                label="Price (USD)"
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="0.00"
                error={errors.price}
                step="0.01"
                min="0"
                required
              />

              <ShopifyButton
                onClick={handleCreateProduct}
                disabled={isCreating || !productName || typeof productName !== 'string' || !productName.trim() || !productPrice || typeof productPrice !== 'string' || !productPrice.trim()}
                className="w-full"
                size="lg"
              >
                {isCreating ? 'Creating...' : 'Add to Cart'}
              </ShopifyButton>

              {errors.submit && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </div>
          </ShopifyCard>

          {/* Features */}
          <div className="mt-8 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Simple Setup</h3>
                <p className="text-sm text-gray-600">Add products in seconds</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Secure Payments</h3>
                <p className="text-sm text-gray-600">Powered by Stripe</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100">
                  <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Fast Checkout</h3>
                <p className="text-sm text-gray-600">Shopify-style experience</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Preview Section */}
        <div>
          <ShopifyCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Preview</h3>

            <div className="border rounded-lg p-6 bg-gray-50">
              {productName ? (
                <>
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>

                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {productName || 'Product Name'}
                  </h4>

                  <p className="text-2xl font-bold text-gray-900 mb-4">
                    ${productPrice || '0.00'}
                  </p>

                  <div className="space-y-3">
                    <ShopifyButton
                      onClick={handleCreateProduct}
                      disabled={isCreating || !productName || typeof productName !== 'string' || !productName.trim() || !productPrice || typeof productPrice !== 'string' || !productPrice.trim()}
                      className="w-full"
                      variant="primary"
                      size="lg"
                    >
                      {isCreating ? 'Creating...' : 'Buy Now'}
                    </ShopifyButton>

                    <ShopifyButton
                      onClick={handleCreateProduct}
                      disabled={isCreating || !productName || typeof productName !== 'string' || !productName.trim() || !productPrice || typeof productPrice !== 'string' || !productPrice.trim()}
                      className="w-full"
                      variant="outline"
                      size="lg"
                    >
                      {isCreating ? 'Creating...' : 'Add to Cart'}
                    </ShopifyButton>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    <p>✓ Secure checkout</p>
                    <p>✓ Instant delivery</p>
                    <p>✓ 24/7 support</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500">Enter product details to see preview</p>
                </div>
              )}
            </div>
          </ShopifyCard>
        </div>
      </div>
    </div>
  );
}