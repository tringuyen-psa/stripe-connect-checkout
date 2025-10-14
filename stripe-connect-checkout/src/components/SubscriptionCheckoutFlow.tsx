'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/hooks/useCart';
import ContactForm, { ContactFormData } from './ContactForm';
import ShippingForm, { ShippingFormData, ShippingOption } from './ShippingForm';
import OrderSummary from './OrderSummary';
import ShopifyButton from './ShopifyButton';
import ShopifyCard from './ShopifyCard';
import ShopifyInput from './ShopifyInput';

type CheckoutStep = 'contact' | 'shipping' | 'payment' | 'review' | 'complete';
type SubscriptionInterval = 'month' | 'year' | 'week' | 'day';

interface SubscriptionData {
  customerId?: string;
  priceId?: string;
  subscriptionId?: string;
  clientSecret?: string;
}

export default function SubscriptionCheckoutFlow() {
  const { cart, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('contact');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({});
  const [hasCreatedSubscription, setHasCreatedSubscription] = useState(false);

  // Subscription settings
  const [subscriptionInterval, setSubscriptionInterval] = useState<SubscriptionInterval>('month');
  const [subscriptionIntervalCount, setSubscriptionIntervalCount] = useState(1);
  const [isSubscription, setIsSubscription] = useState(true); // Default to subscription

  // Form data
  const [contactData, setContactData] = useState<ContactFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const [shippingData, setShippingData] = useState<ShippingFormData>({
    address: {
      address: '',
      apartment: '',
      city: '',
      country: 'United States',
      postalCode: ''
    },
    shippingMethod: ''
  });

  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);

  // Calculate order totals
  const subtotal = cart.subtotal;
  const shippingCost = selectedShippingOption?.price || 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shippingCost + tax;

  // Initialize first shipping option as default
  useEffect(() => {
    if (!selectedShippingOption && shippingData.shippingMethod) {
      const standardShipping: ShippingOption = {
        id: 'standard',
        name: 'Standard Shipping',
        price: 1.00,
        estimatedDays: '5-7',
        description: 'Standard delivery',
        type: 'standard'
      };
      setSelectedShippingOption(standardShipping);
    }
  }, [shippingData.shippingMethod]);

  // Create customer
  const createCustomer = useCallback(async () => {
    try {
      console.log('👤 TẠO CUSTOMER CHO SUBSCRIPTION');
      console.log('📧 Email:', contactData.email);
      console.log('👤 Name:', `${contactData.firstName} ${contactData.lastName}`);

      const response = await fetch('/api/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contactData.email,
          name: `${contactData.firstName} ${contactData.lastName}`,
          phone: contactData.phone,
          address: shippingData.address,
          useConnectedAccount: true, // Always use Connected Account for subscription
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create customer');
      }

      console.log('✅ Customer created:', data.customerId);
      return data.customerId;

    } catch (error) {
      console.error('❌ Error creating customer:', error);
      throw error;
    }
  }, [contactData, shippingData.address]);

  // Create recurring price
  const createRecurringPrice = useCallback(async () => {
    try {
      console.log('💰 TẠO RECURRING PRICE CHO SUBSCRIPTION');
      console.log('💵 Amount:', total.toFixed(2));
      console.log('🔄 Interval:', subscriptionIntervalCount + ' ' + subscriptionInterval + '(s)');

      const response = await fetch('/api/create-recurring-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'usd',
          interval: subscriptionInterval,
          intervalCount: subscriptionIntervalCount,
          nickname: `Subscription - ${subscriptionIntervalCount} ${subscriptionInterval}(s)`,
          useConnectedAccount: true, // Always use Connected Account
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create recurring price');
      }

      console.log('✅ Recurring price created:', data.priceId);
      return data.priceId;

    } catch (error) {
      console.error('❌ Error creating recurring price:', error);
      throw error;
    }
  }, [total, subscriptionInterval, subscriptionIntervalCount]);

  // Create subscription
  const createSubscription = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 TẠO SUBSCRIPTION');
      console.log('💰 Total amount:', total.toFixed(2) + ' USD');
      console.log('📦 Số sản phẩm:', cart.items.length);
      console.log('🔄 Billing cycle:', subscriptionIntervalCount + ' ' + subscriptionInterval + '(s)');

      // Step 1: Create customer
      const customerId = await createCustomer();
      if (!customerId) throw new Error('Failed to create customer');

      // Step 2: Create recurring price
      const priceId = await createRecurringPrice();
      if (!priceId) throw new Error('Failed to create recurring price');

      // Step 3: Create subscription
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          priceId,
          email: contactData.email,
          useConnectedAccount: true, // Always use Connected Account
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      setSubscriptionData({
        customerId: data.customerId,
        priceId: priceId,
        subscriptionId: data.subscriptionId,
        clientSecret: data.clientSecret,
      });

      console.log('✅ Subscription created successfully!');
      console.log('📋 Subscription ID:', data.subscriptionId);
      console.log('🔗 Client Secret:', data.clientSecret);
      console.log('🏪 Connect Account:', data.connectedAccountId);
      console.log('💸 Tiền subscription sẽ đi thẳng vào Connect Account');
      console.log('=============================================');

      // Open popup for subscription payment confirmation
      console.log('🔓 Mở popup subscription payment');
      const popup = window.open(
        `/subscription-payment?client_secret=${data.clientSecret}&subscription_id=${data.subscriptionId}`,
        'subscription-checkout',
        'width=500,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
      );

      // Check if popup opened successfully
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Fallback: open in same tab if popup blocked
        console.log('⚠️ Popup bị chặn, mở trong cùng tab');
        window.location.href = `/subscription-payment?client_secret=${data.clientSecret}&subscription_id=${data.subscriptionId}`;
      } else {
        // Listen for popup close
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            console.log('✅ Subscription popup đã đóng');
            setIsLoading(false);
            setCurrentStep('complete');
            clearCart();
          }
        }, 1000);
      }

    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      setErrors({ payment: 'Failed to create subscription. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [total, cart.items, subscriptionInterval, subscriptionIntervalCount, createCustomer, createRecurringPrice, contactData.email, clearCart]);

  // Create subscription when reaching payment step
  useEffect(() => {
    if (currentStep === 'payment' && total > 0 && selectedShippingOption && !hasCreatedSubscription) {
      console.log('🚀 Đến bước thanh toán, chuẩn bị tạo subscription');
      setHasCreatedSubscription(true);
      createSubscription();
    }
  }, [currentStep === 'payment', total > 0, selectedShippingOption?.id, hasCreatedSubscription]);

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'contact') {
      if (!contactData.email) newErrors.email = 'Email is required';
      if (!contactData.firstName) newErrors.firstName = 'First name is required';
      if (!contactData.lastName) newErrors.lastName = 'Last name is required';
    }

    if (currentStep === 'shipping') {
      if (!shippingData.address.address) newErrors.address = 'Address is required';
      if (!shippingData.address.city) newErrors.city = 'City is required';
      if (!shippingData.address.postalCode) newErrors.postalCode = 'Postal code is required';
      if (!shippingData.shippingMethod) newErrors.shippingMethod = 'Shipping method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    const steps: CheckoutStep[] = ['contact', 'shipping', 'payment', 'review', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps: CheckoutStep[] = ['contact', 'shipping', 'payment', 'review', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      if (currentStep === 'payment') {
        setHasCreatedSubscription(false);
      }
    }
  };

  const getSubscriptionDescription = () => {
    const intervalText = subscriptionIntervalCount === 1 ? subscriptionInterval : `${subscriptionIntervalCount} ${subscriptionInterval}s`;
    return `$${total.toFixed(2)} every ${intervalText}`;
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <ShopifyCard>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Giỏ hàng trống</h2>
              <p className="text-gray-600 mb-4">Giỏ hàng của bạn đang trống. Thêm sản phẩm trước khi thanh toán.</p>
              <ShopifyButton onClick={() => window.location.href = '/'}>
                Tiếp tục mua sắm
              </ShopifyButton>
            </div>
          </ShopifyCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Subscription Checkout</h1>
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm text-gray-600">Recurring Payment</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Subscription Settings */}
        <ShopifyCard className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Cycle
              </label>
              <select
                value={subscriptionInterval}
                onChange={(e) => setSubscriptionInterval(e.target.value as SubscriptionInterval)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interval Count
              </label>
              <ShopifyInput
                type="number"
                min="1"
                value={subscriptionIntervalCount}
                onChange={(e) => setSubscriptionIntervalCount(parseInt(e.target.value) || 1)}
                placeholder="1"
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Subscription Summary:</strong> You will be charged <strong>{getSubscriptionDescription()}</strong>
              until you cancel. You can cancel anytime.
            </p>
          </div>
        </ShopifyCard>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { step: 'contact', label: 'Thông tin' },
              { step: 'shipping', label: 'Giao hàng' },
              { step: 'payment', label: 'Thanh toán' },
              { step: 'review', label: 'Xác nhận' }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === item.step ||
                    (currentStep === 'complete' && index < 3) ||
                    (['payment', 'review'].includes(currentStep) && index < 2) ||
                    (currentStep === 'review' && index < 3)
                      ? 'bg-[#5b6c8a] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                  {item.label}
                </span>
                {index < 3 && (
                  <div
                    className={`w-8 h-0.5 ml-4 hidden sm:block ${
                      (currentStep === 'shipping' && index === 0) ||
                      (currentStep === 'payment' && index < 2) ||
                      (currentStep === 'review' && index < 3) ||
                      currentStep === 'complete'
                        ? 'bg-[#5b6c8a]'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 'contact' && (
              <ContactForm
                data={contactData}
                onChange={setContactData}
                errors={errors}
              />
            )}

            {currentStep === 'shipping' && (
              <ShippingForm
                data={shippingData}
                onChange={(data) => {
                  setShippingData(data);
                  if (data.shippingMethod) {
                    const options: ShippingOption[] = [
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
                      }
                    ];
                    const option = options.find(o => o.id === data.shippingMethod);
                    setSelectedShippingOption(option || null);
                  }
                }}
                errors={errors}
              />
            )}

            {currentStep === 'payment' && (
              <ShopifyCard>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Setting up subscription...</h2>
                <div className="text-center py-8">
                  {isLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b6c8a] mb-4"></div>
                      <span className="text-gray-600 mb-4">Creating your subscription...</span>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Setting up recurring payments: {getSubscriptionDescription()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Ready</h3>
                        <p className="text-gray-600 mb-6">
                          Your subscription will be activated after payment confirmation.
                        </p>
                      </div>
                      <ShopifyButton
                        onClick={() => window.location.href = `/subscription-payment?client_secret=${subscriptionData.clientSecret}&subscription_id=${subscriptionData.subscriptionId}`}
                        className="w-full text-lg py-3"
                        size="lg"
                      >
                        Complete Subscription Setup - {getSubscriptionDescription()}
                      </ShopifyButton>
                    </div>
                  )}
                </div>
              </ShopifyCard>
            )}

            {currentStep === 'review' && (
              <ShopifyCard>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Subscription</h2>
                <div className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-green-900 mb-2">Subscription Details</h3>
                    <p className="text-green-800">
                      <strong>Billing Cycle:</strong> {getSubscriptionDescription()}<br/>
                      <strong>Next Payment:</strong> Today (${total.toFixed(2)})<br/>
                      <strong>Subsequent Payments:</strong> Every {subscriptionIntervalCount === 1 ? subscriptionInterval : `${subscriptionIntervalCount} ${subscriptionInterval}s`}
                    </p>
                  </div>

                  {/* Customer Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        {contactData.firstName} {contactData.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{contactData.email}</p>
                      {contactData.phone && (
                        <p className="text-sm text-gray-600">{contactData.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Shipping Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{shippingData.address.address}</p>
                      {shippingData.address.apartment && (
                        <p className="text-sm text-gray-600">{shippingData.address.apartment}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {shippingData.address.city}, {shippingData.address.country} {shippingData.address.postalCode}
                      </p>
                    </div>
                  </div>
                </div>
              </ShopifyCard>
            )}

            {currentStep === 'complete' && (
              <ShopifyCard>
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <svg
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Activated!</h2>
                  <p className="text-gray-600 mb-4">
                    Your subscription has been successfully activated. You will be charged {getSubscriptionDescription()}.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Subscription ID:</strong> {subscriptionData.subscriptionId}<br/>
                      <strong>Next Billing:</strong> {getSubscriptionDescription()}
                    </p>
                  </div>
                  <ShopifyButton onClick={() => window.location.href = '/'}>
                    Go to Dashboard
                  </ShopifyButton>
                </div>
              </ShopifyCard>
            )}

            {/* Navigation Buttons */}
            {currentStep !== 'complete' && (
              <div className="flex justify-between">
                {currentStep !== 'contact' && (
                  <ShopifyButton onClick={handlePrevious} variant="outline">
                    Quay lại bước trước
                  </ShopifyButton>
                )}

                <div className="ml-auto">
                  {currentStep === 'review' ? (
                    <ShopifyButton
                      onClick={handleNext}
                      disabled={!selectedShippingOption}
                      className="min-w-[200px]"
                    >
                      Activate Subscription
                    </ShopifyButton>
                  ) : currentStep !== 'payment' && (
                    <ShopifyButton onClick={handleNext}>
                      Tiếp tục {currentStep === 'contact' ? 'giao hàng' : currentStep === 'shipping' ? 'thanh toán' : 'xác nhận'}
                    </ShopifyButton>
                  )}
                </div>
              </div>
            )}

            {errors.payment && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{errors.payment}</p>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={cart.items}
              subtotal={subtotal}
              shipping={shippingCost}
              tax={tax}
              total={total}
            />

            {/* Subscription Summary */}
            <div className="mt-6">
              <ShopifyCard>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Setup Fee (Today)</span>
                    <span className="text-sm font-medium text-gray-900">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Recurring Amount</span>
                    <span className="text-sm font-medium text-gray-900">{getSubscriptionDescription()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Billing Cycle</span>
                    <span className="text-sm font-medium text-gray-900">
                      Every {subscriptionIntervalCount === 1 ? subscriptionInterval : `${subscriptionIntervalCount} ${subscriptionInterval}s`}
                    </span>
                  </div>
                </div>
              </ShopifyCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}