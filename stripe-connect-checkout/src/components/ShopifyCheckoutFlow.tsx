'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/hooks/useCart';
import ContactForm, { ContactFormData } from './ContactForm';
import ShippingForm, { ShippingFormData, ShippingOption } from './ShippingForm';
import OrderSummary from './OrderSummary';
import ShopifyButton from './ShopifyButton';
import ShopifyCard from './ShopifyCard';

// Xóa các imports không dùng
// import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';

type CheckoutStep = 'contact' | 'shipping' | 'payment' | 'review' | 'complete';

export default function ShopifyCheckoutFlow() {
  const { cart, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('contact');
  const [isLoading, setIsLoading] = useState(false);
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

    const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [hasCreatedCheckout, setHasCreatedCheckout] = useState(false);

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
        price: 0.1,
        estimatedDays: '5-7',
        description: 'Standard delivery',
        type: 'standard'
      };
      setSelectedShippingOption(standardShipping);
    }
  }, [shippingData.shippingMethod]); // Remove selectedShippingOption from deps to prevent infinite loop

  const createCheckoutSession = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🎯 TẠO CHECKOUT SESSION VỚI TỔNG TIỀN CUỐI CÙNG');
      console.log('💰 Total amount:', total.toFixed(2) + ' USD');
      console.log('📦 Số sản phẩm:', cart.items.length);
      console.log('🚚 Shipping cost:', shippingCost.toFixed(2) + ' USD');

      // Lấy sản phẩm đầu tiên để tạo (hoặc tạo product gộp tất cả)
      const firstItem = cart.items[0];
      const productName = cart.items.length === 1
        ? firstItem.name
        : `Đơn hàng ${cart.items.length} sản phẩm`;

      console.log('📦 Product name:', productName);

      // Gọi API /api/products/ để tạo checkout session với Direct Charge
      console.log('🌐 Calling /api/products API...');
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productName,
          price: total,
          currency: 'usd',
          description: `Thanh toán cho ${cart.items.length} sản phẩm. Tổng: $${total.toFixed(2)} (bao gồm phí vận chuyển: $${shippingCost.toFixed(2)})`
        })
      });

      console.log('📡 API Response status:', response.status);
      const data = await response.json();
      console.log('📦 API Response data:', data);

      if (!response.ok) {
        console.error('❌ API Error:', data.error);
        throw new Error(data.error || 'Failed to create checkout session');
      }

      console.log('✅ Checkout session tạo thành công!');
      console.log('🔗 Checkout URL:', data.checkoutUrl);
      console.log('📋 Session ID:', data.sessionId);
      console.log('🏪 Connect Account:', data.connectAccountId);
      console.log('💸 Tiền sẽ đi thẳng vào Connect Account');
      console.log('========================================');

      // Mở popup nhỏ cho Stripe checkout
      console.log('🔓 Mở popup Stripe checkout với kích thước nhỏ');
      console.log('🌐 Popup URL:', data.checkoutUrl);

      const popup = window.open(
        data.checkoutUrl,
        'stripe-checkout',
        'width=500,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
      );

      console.log('🔍 Popup result:', popup);
      console.log('🔍 Popup closed:', popup?.closed);

      // Kiểm tra popup có mở được không
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Fallback: mở trong cùng tab nếu popup bị chặn
        console.log('⚠️ Popup bị chặn, mở trong cùng tab');
        console.log('🔄 Redirecting to:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else {
        console.log('✅ Popup opened successfully!');
        // Lắng nghe khi popup đóng
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            console.log('✅ Popup đã đóng, hiển thị thông báo thành công');

            // Hiển thị thông báo thanh toán thành công
            setIsLoading(false);
            setCurrentStep('complete');

            // Xóa cart sau khi thanh toán
            clearCart();

            console.log('🛒 Đã xóa giỏ hàng và hiển thị trang hoàn tất');
          }
        }, 1000);
      }

    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      setErrors({ payment: `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsLoading(false);
    }
  }, [total, cart.items, shippingCost, clearCart]); // Remove currentStep to prevent re-creation on step change

  // TẠO CHECKOUT SESSION KHI ĐẾN BƯỚC THANH TOÁN (có tổng tiền cuối cùng)
  useEffect(() => {
    // Chỉ tạo khi đến step 'payment' và đã có tổng tiền, và chưa tạo checkout trước đó
    if (currentStep === 'payment' && total > 0 && selectedShippingOption && !hasCreatedCheckout) {
      console.log('🚀 Đến bước thanh toán, chuẩn bị tạo checkout session');
      setHasCreatedCheckout(true); // Prevent multiple calls

      // Delay slightly to avoid rapid re-calls
      const timeoutId = setTimeout(() => {
        createCheckoutSession();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [currentStep === 'payment', total > 0, selectedShippingOption?.id, hasCreatedCheckout]); // Remove createCheckoutSession from deps to prevent infinite loop

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'contact') {
      if (!contactData.email) {
        newErrors.email = 'Email is required';
      } else {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactData.email.trim())) {
          newErrors.email = 'Please enter a valid email address';
        }
      }
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
      // Reset checkout flag when going back from payment step
      if (currentStep === 'payment') {
        setHasCreatedCheckout(false);
      }
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
                    price: 0.1,
                    estimatedDays: '5-7',
                    description: 'Standard delivery',
                    type: 'standard'
                  },
                  {
                    id: 'express',
                    name: 'Express Shipping',
                    price: 1.00,
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
          <ShopifyCard>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Phương thức thanh toán</h2>

            <div className="text-center py-8">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b6c8a] mb-4"></div>
                  <span className="text-gray-600 mb-4">Đang mở trang thanh toán an toàn...</span>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">Popup thanh toán đang mở, vui lòng đợi...</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Thanh toán an toàn với Stripe</h3>
                    <p className="text-gray-600 mb-6">
                      Bạn sẽ được chuyển đến trang thanh toán bảo mật của Stripe để hoàn tất đơn hàng.
                    </p>
                  </div>

                  <div className="space-y-3 text-sm text-gray-600 mb-6">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Thanh toán được bảo vệ bởi Stripe</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Tiền sẽ vào tài khoản Connect an toàn</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Tổng tiền: ${total.toFixed(2)} (đã bao gồm phí vận chuyển)</span>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <div className="mt-6">
                    <ShopifyButton
                      onClick={() => {
                        console.log('💳 User click thanh toán - gọi createCheckoutSession');
                        createCheckoutSession();
                      }}
                      className="w-full text-lg py-3"
                      size="lg"
                    >
                      💳 Thanh toán ngay - ${total.toFixed(2)}
                    </ShopifyButton>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Mẹo:</strong> Nhấn nút trên để mở popup thanh toán nhỏ gọn
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ShopifyCard>
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
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Thanh toán an toàn qua Stripe</p>
                      <p className="text-sm text-gray-600">Thẻ tín dụng, debit card và các phương thức khác</p>
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
                      Hoàn tất đơn hàng
                    </ShopifyButton>
                  ) : (
                    <ShopifyButton onClick={handleNext}>
                      Tiếp tục {currentStep === 'contact' ? 'giao hàng' : currentStep === 'shipping' ? 'thanh toán' : currentStep === 'payment' ? 'xác nhận' : ''}
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