'use client';

import { useState } from 'react';
import ShopifyInput from './ShopifyInput';
import ShopifyCard from './ShopifyCard';

export interface ShippingAddress {
  address: string;
  apartment: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  description: string;
  type: 'standard' | 'express' | 'overnight';
}

export interface ShippingFormData {
  address: ShippingAddress;
  shippingMethod: string;
}

export interface ShippingFormProps {
  data: ShippingFormData;
  onChange: (data: ShippingFormData) => void;
  errors?: Partial<ShippingAddress & { shippingMethod: string }>;
}

const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    price: 1.00,
    estimatedDays: '5-7',
    description: 'Standard delivery',
    type: 'standard'
  },
  {
    id: 'express',
    name: 'Express Shipping',
    price: 12.99,
    estimatedDays: '2-3',
    description: 'Express delivery',
    type: 'express'
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    price: 24.99,
    estimatedDays: '1',
    description: 'Next day delivery',
    type: 'overnight'
  }
];

export default function ShippingForm({ data, onChange, errors }: ShippingFormProps) {
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(
    SHIPPING_OPTIONS.find(option => option.id === data.shippingMethod) || null
  );

  const handleAddressChange = (field: keyof ShippingAddress, event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...data,
      address: {
        ...data.address,
        [field]: event.target.value
      }
    });
  };

  const handleShippingMethodChange = (option: ShippingOption) => {
    setSelectedShipping(option);
    onChange({
      ...data,
      shippingMethod: option.id
    });
  };

  return (
    <>
      <ShopifyCard>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Address</h2>

        <div className="space-y-4">
          <ShopifyInput
            label="Address"
            value={data.address.address}
            onChange={(e) => handleAddressChange('address', e)}
            error={errors?.address}
            placeholder="123 Main Street"
            required
          />

          <ShopifyInput
            label="Apartment, suite, etc. (optional)"
            value={data.address.apartment}
            onChange={(e) => handleAddressChange('apartment', e)}
            error={errors?.apartment}
            placeholder="Apt 4B, Suite 200"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ShopifyInput
              label="City"
              value={data.address.city}
              onChange={(e) => handleAddressChange('city', e)}
              error={errors?.city}
              required
            />
            <ShopifyInput
              label="Country"
              value={data.address.country}
              onChange={(e) => handleAddressChange('country', e)}
              error={errors?.country}
              placeholder="United States"
            />
          </div>

          <ShopifyInput
            label="Postal Code"
            value={data.address.postalCode}
            onChange={(e) => handleAddressChange('postalCode', e)}
            error={errors?.postalCode}
            placeholder="10001"
            required
          />

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-sm text-green-800">
                <p className="font-medium">Secure delivery</p>
                <p className="mt-1">Your package will be delivered safely and on time.</p>
              </div>
            </div>
          </div>
        </div>
      </ShopifyCard>

      <ShopifyCard className="mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Method</h2>

        <div className="space-y-3">
          {SHIPPING_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedShipping?.id === option.id
                  ? 'border-[#5b6c8a] bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="shipping"
                value={option.id}
                checked={selectedShipping?.id === option.id}
                onChange={() => handleShippingMethodChange(option)}
                className="mr-3 h-4 w-4 text-[#5b6c8a] focus:ring-[#5b6c8a] border-gray-300"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{option.name}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{option.estimatedDays} business days</p>
                  </div>
                  <span className="font-medium text-gray-900">${option.price.toFixed(2)}</span>
                </div>
              </div>
            </label>
          ))}
        </div>

        {errors?.shippingMethod && (
          <p className="mt-2 text-sm text-red-600">{errors.shippingMethod}</p>
        )}

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Free shipping available</p>
              <p className="mt-1">Free shipping on orders over $50</p>
            </div>
          </div>
        </div>
      </ShopifyCard>
    </>
  );
}