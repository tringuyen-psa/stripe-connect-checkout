'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '@/hooks/useCart';
import ContactForm, { ContactFormData } from './ContactForm';
import ShippingForm, { ShippingFormData, ShippingOption } from './ShippingForm';
import PaymentMethodSelector, { PaymentMethod } from './PaymentMethodSelector';
import OrderSummary from './OrderSummary';
import ShopifyButton from './ShopifyButton';
import ShopifyCard from './ShopifyCard';
import { PAYMENT_METHODS } from './PaymentMethodSelector';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type CheckoutStep = 'contact' | 'shipping' | 'payment' | 'review' | 'complete';

export default function ShopifyCheckoutFlow() {
  const { cart, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('contact');
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);

  // Calculate order totals
  const subtotal = cart.subtotal;
  const shippingCost = selectedShippingOption?.price || 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shippingCost + tax;

  // Initialize first shipping option as default
  useEffect(() => {
    if (!selectedShippingOption && shippingData.shippingMethod) {
      // Find selected shipping option
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
  }, [shippingData.shippingMethod, selectedShippingOption]);

  const createPaymentIntent = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'usd'
        })
      });

      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setErrors({ payment: 'Failed to initialize payment. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [total]);

  // Create payment intent when we reach payment step
  useEffect(() => {
    if (currentStep === 'payment' && total > 0 && !clientSecret) {
      createPaymentIntent();
    }
  }, [currentStep, total, clientSecret, createPaymentIntent]);

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
    }
  };

  
  const renderProgressBar = () => (
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
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'contact':
        return (
          <ContactForm
            data={contactData}
            onChange={setContactData}
            errors={errors}
          />
        );

      case 'shipping':
        return (
          <ShippingForm
            data={shippingData}
            onChange={(data) => {
              setShippingData(data);
              // Update selected shipping option
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
                const option = options.find(o => o.id === data.shippingMethod);
                setSelectedShippingOption(option || null);
              }
            }}
            errors={errors}
          />
        );

      case 'payment':
        return (
          <>
            <PaymentMethodSelector
              selectedMethod={selectedPayment}
              onMethodChange={setSelectedPayment}
              showCardForm={true}
            >
              {selectedPayment.type === 'stripe' && (
                <>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b6c8a]"></div>
                      <span className="ml-2 text-gray-600">Đang tải biểu mẫu thanh toán...</span>
                    </div>
                  ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <PaymentForm onPayment={(paymentIntent) => {
                        clearCart();
                        if (paymentIntent) {
                          console.log('PaymentIntent received:', paymentIntent);
                          console.log('PaymentIntent amount (cents):', paymentIntent.amount);
                          // Store payment info in sessionStorage for success page
                          sessionStorage.setItem('payment_amount', paymentIntent.amount.toString());
                          sessionStorage.setItem('payment_currency', paymentIntent.currency || 'usd');
                        }
                        window.location.href = '/success';
                      }} />
                    </Elements>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Đang tải các lựa chọn thanh toán...</p>
                    </div>
                  )}
                </>
              )}
            </PaymentMethodSelector>

            {/* Payment button */}
            <div className="mt-6">
              <ShopifyButton
                type="submit"
                form="payment-form"
                disabled={!selectedShippingOption}
                className="w-full relative"
                size="lg"
              >
                <span id="payment-button-text">Thanh toán ${total.toFixed(2)}</span>
                <div id="payment-spinner" className="hidden absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span>Đang xử lý...</span>
                </div>
              </ShopifyButton>
            </div>
          </>
        );

      case 'review':
        return (
          <ShopifyCard>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Xác nhận đơn hàng</h2>

            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Thông tin liên hệ</h3>
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
                <h3 className="text-lg font-medium text-gray-900 mb-3">Địa chỉ giao hàng</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">{shippingData.address.address}</p>
                  {shippingData.address.apartment && (
                    <p className="text-sm text-gray-600">{shippingData.address.apartment}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {shippingData.address.city}, {shippingData.address.country} {shippingData.address.postalCode}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedShippingOption?.name} - ${selectedShippingOption?.price.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Phương thức thanh toán</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{selectedPayment.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedPayment.name}</p>
                      <p className="text-sm text-gray-600">{selectedPayment.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ShopifyCard>
        );

      case 'complete':
        return (
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h2>
              <p className="text-gray-600">Cảm ơn bạn đã mua hàng. Bạn sẽ nhận được email xác nhận sớm.</p>
            </div>
          </ShopifyCard>
        );

      default:
        return null;
    }
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
            <h1 className="text-xl font-bold text-gray-900">Thanh toán an toàn</h1>
            <div className="flex items-center space-x-2">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm text-gray-600">Thanh toán an toàn</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {renderProgressBar()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {renderStepContent()}

            {/* Navigation Buttons */}
            {currentStep !== 'complete' && currentStep !== 'payment' && (
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
                      Hoàn tất đơn hàng
                    </ShopifyButton>
                  ) : (
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
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentForm({ onPayment }: { onPayment: (paymentIntent?: {
  id: string;
  amount: number;
  currency: string;
  status: string;
}) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const getErrorMessage = (error: { type?: string; code?: string; decline_code?: string; message?: string }): string => {
    if (error.type === 'card_error') {
      switch (error.code) {
        case 'card_declined':
          switch (error.decline_code) {
            case 'live_mode_test_card':
              return 'Bạn đang sử dụng thẻ test ở chế độ live. Vui lòng chuyển sang test mode hoặc sử dụng thẻ thật.';
            case 'insufficient_funds':
              return 'Thẻ không đủ số dư. Vui lòng sử dụng thẻ khác.';
            case 'expired_card':
              return 'Thẻ đã hết hạn. Vui lòng sử dụng thẻ khác.';
            case 'incorrect_cvc':
              return 'Mã CVC không chính xác. Vui lòng kiểm tra lại.';
            case 'incorrect_number':
              return 'Số thẻ không chính xác. Vui lòng kiểm tra lại.';
            default:
              return 'Thẻ bị từ chối. Vui lòng thử thẻ khác.';
          }
        case 'invalid_expiry_year':
          return 'Năm hết hạn không hợp lệ.';
        case 'invalid_expiry_month':
          return 'Tháng hết hạn không hợp lệ.';
        case 'invalid_number':
          return 'Số thẻ không hợp lệ.';
        case 'incomplete_number':
          return 'Số thẻ chưa đầy đủ.';
        case 'incomplete_expiry':
          return 'Thời hạn hết hạn chưa đầy đủ.';
        case 'incomplete_cvc':
          return 'Mã CVC chưa đầy đủ.';
        default:
          return error.message || 'Lỗi thanh toán. Vui lòng thử lại.';
      }
    }

    if (error.type === 'validation_error') {
      return 'Thông tin thẻ không hợp lệ. Vui lòng kiểm tra lại.';
    }

    if (error.type === 'api_error') {
      return 'Lỗi kết nối với cổng thanh toán. Vui lòng thử lại sau.';
    }

    return 'Đã xảy ra lỗi thanh toán. Vui lòng thử lại.';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    // Show loading state on button
    const buttonText = document.getElementById('payment-button-text');
    const spinner = document.getElementById('payment-spinner');
    if (buttonText) buttonText.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');

    if (!stripe || !elements) {
      setErrorMessage('Dịch vụ thanh toán chưa sẵn sàng. Vui lòng tải lại trang.');
      // Hide loading state
      if (buttonText) buttonText.classList.remove('hidden');
      if (spinner) spinner.classList.add('hidden');
      return;
    }

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
      });

      if (result.error) {
        const friendlyMessage = getErrorMessage(result.error);
        setErrorMessage(friendlyMessage);
        console.error('Payment error:', result.error);
        // Hide loading state on error
        if (buttonText) buttonText.classList.remove('hidden');
        if (spinner) spinner.classList.add('hidden');
      } else if ('paymentIntent' in result) {
        // Payment successful
        const paymentIntent = result.paymentIntent as {
          id: string;
          amount: number;
          currency: string;
          status: string;
        };
        console.log('PaymentIntent received:', paymentIntent);
        console.log('PaymentIntent amount (cents):', paymentIntent.amount);
        onPayment(paymentIntent);
      }
    } catch (error: unknown) {
      const friendlyMessage = getErrorMessage(error as { type?: string; code?: string; decline_code?: string; message?: string });
      setErrorMessage(friendlyMessage);
      console.error('Payment error:', error);
      // Hide loading state on error
      if (buttonText) buttonText.classList.remove('hidden');
      if (spinner) spinner.classList.add('hidden');
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement />

      {errorMessage && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}