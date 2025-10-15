'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ShopifyCard from './ShopifyCard';
import ShopifyButton from './ShopifyButton';
import ShopifyInput from './ShopifyInput';
import ShopifyCartSummary from './ShopifyCartSummary';
import { useCart } from '@/hooks/useCart';
import {
    CartItem,
    ShippingOption,
    PaymentMethod,
    CheckoutFormData,
    OrderSummary
} from '@/types/checkout';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST!);

const SHIPPING_OPTIONS: ShippingOption[] = [
    {
        id: 'standard',
        name: 'Standard Shipping',
        price: 5.99,
        estimatedDays: '5-7',
        description: 'Standard delivery'
    },
    {
        id: 'express',
        name: 'Express Shipping',
        price: 12.99,
        estimatedDays: '2-3',
        description: 'Express delivery'
    },
    {
        id: 'overnight',
        name: 'Overnight Shipping',
        price: 24.99,
        estimatedDays: '1',
        description: 'Next day delivery'
    }
];

const PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: 'stripe',
        name: 'Credit Card',
        type: 'stripe',
        icon: '💳',
        description: 'Pay with Visa, Mastercard, or American Express'
    },
    {
        id: 'paypal',
        name: 'PayPal',
        type: 'paypal',
        icon: '🅿️',
        description: 'Pay with your PayPal account'
    }
];

function CheckoutForm() {
    const { cart } = useCart();
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
    const [orderSummary, setOrderSummary] = useState<OrderSummary>({
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0
    });
    const [formData, setFormData] = useState<CheckoutFormData>({
        email: '',
        firstName: '',
        lastName: '',
        address: '',
        apartment: '',
        city: '',
        country: 'United States',
        postalCode: '',
        phone: '',
        shippingMethod: '',
        paymentMethod: 'stripe',
        saveInfo: false
    });
    const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const stripe = useStripe();
    const elements = useElements();

    // Calculate order summary
    useEffect(() => {
        const subtotal = cart.items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
        const shipping = selectedShipping?.price || 0;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + shipping + tax;

        setOrderSummary({
            subtotal,
            shipping,
            tax,
            total
        });
    }, [cart.items, selectedShipping]);

    const createPaymentIntent = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: orderSummary.total,
                    currency: 'usd'
                })
            });

            const data = await response.json();
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
            }
        } catch (error) {
            console.error('Error creating payment intent:', error);
        } finally {
            setIsLoading(false);
        }
    }, [orderSummary.total]);

    // Create payment intent when total changes and we're on payment step
    useEffect(() => {
        if (currentStep === 3 && orderSummary.total > 0 && !clientSecret) {
            createPaymentIntent();
        }
    }, [currentStep, orderSummary.total, clientSecret, createPaymentIntent]);

    const handleQuantityChange = (itemId: string, quantity: number) => {
        // These functions would be handled by the useCart hook
        // For now, we'll just update the local state
        console.log('Quantity changed:', itemId, quantity);
    };

    const handleRemoveItem = (itemId: string) => {
        // This would be handled by the useCart hook
        console.log('Item removed:', itemId);
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Partial<CheckoutFormData> = {};

        if (step === 1) {
            if (!formData.email) newErrors.email = 'Email is required';
            if (!formData.firstName) newErrors.firstName = 'First name is required';
            if (!formData.lastName) newErrors.lastName = 'Last name is required';
            if (!formData.address) newErrors.address = 'Address is required';
            if (!formData.city) newErrors.city = 'City is required';
            if (!formData.postalCode) newErrors.postalCode = 'Postal code is required';
        }

        if (step === 2) {
            if (!formData.shippingMethod) newErrors.shippingMethod = 'Shipping method is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleInputChange = (field: keyof CheckoutFormData, event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleCheckboxChange = (field: keyof CheckoutFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.checked;
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleDirectValueChange = (field: keyof CheckoutFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handlePayment = async () => {
        if (!stripe || !elements) return;

        setIsProcessing(true);

        try {
            if (selectedPayment.type === 'stripe') {
                const { error } = await stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        return_url: `${window.location.origin}/success`,
                    },
                });

                if (error) {
                    console.error('Payment error:', error);
                }
            } else if (selectedPayment.type === 'paypal') {
                // PayPal integration logic here
                console.log('PayPal payment processing...');
            }
        } catch (error) {
            console.error('Payment processing error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderProgressBar = () => (
        <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
                {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= step
                                    ? 'bg-[#5b6c8a] text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                        >
                            {step}
                        </div>
                        {step < 4 && (
                            <div
                                className={`w-16 h-0.5 ml-4 ${currentStep > step ? 'bg-[#5b6c8a]' : 'bg-gray-200'
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderContactInfo = () => (
        <ShopifyCard>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
            <div className="space-y-4">
                <ShopifyInput
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e)}
                    error={errors.email}
                    placeholder="email@example.com"
                    required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ShopifyInput
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e)}
                        error={errors.firstName}
                        required
                    />
                    <ShopifyInput
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e)}
                        error={errors.lastName}
                        required
                    />
                </div>
            </div>
        </ShopifyCard>
    );

    const renderShippingAddress = () => (
        <ShopifyCard>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Address</h2>
            <div className="space-y-4">
                <ShopifyInput
                    label="Address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e)}
                    error={errors.address}
                    required
                />

                <ShopifyInput
                    label="Apartment, suite, etc. (optional)"
                    value={formData.apartment}
                    onChange={(e) => handleInputChange('apartment', e)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ShopifyInput
                        label="City"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e)}
                        error={errors.city}
                        required
                    />
                    <ShopifyInput
                        label="Country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ShopifyInput
                        label="Postal Code"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e)}
                        error={errors.postalCode}
                        required
                    />
                    <ShopifyInput
                        label="Phone (optional)"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e)}
                    />
                </div>
            </div>
        </ShopifyCard>
    );

    const renderShippingMethod = () => (
        <ShopifyCard>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Method</h2>
            <div className="space-y-3">
                {SHIPPING_OPTIONS.map((option) => (
                    <label
                        key={option.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${selectedShipping?.id === option.id
                                ? 'border-[#5b6c8a] bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        <input
                            type="radio"
                            name="shipping"
                            value={option.id}
                            checked={selectedShipping?.id === option.id}
                            onChange={(e) => {
                                setSelectedShipping(option);
                                handleDirectValueChange('shippingMethod', e.target.value);
                            }}
                            className="mr-3"
                        />
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900">{option.name}</h3>
                                    <p className="text-sm text-gray-600">{option.description}</p>
                                    <p className="text-xs text-gray-500">{option.estimatedDays} business days</p>
                                </div>
                                <span className="font-medium text-gray-900">${option.price.toFixed(2)}</span>
                            </div>
                        </div>
                    </label>
                ))}
            </div>
        </ShopifyCard>
    );

    const renderPaymentMethod = () => (
        <ShopifyCard>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>

            <div className="space-y-4 mb-6">
                {PAYMENT_METHODS.map((method) => (
                    <label
                        key={method.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${selectedPayment.id === method.id
                                ? 'border-[#5b6c8a] bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        <input
                            type="radio"
                            name="payment"
                            value={method.id}
                            checked={selectedPayment.id === method.id}
                            onChange={(e) => {
                                const method = PAYMENT_METHODS.find(m => m.id === e.target.value);
                                if (method) {
                                    setSelectedPayment(method);
                                    handleDirectValueChange('paymentMethod', e.target.value);
                                }
                            }}
                            className="mr-3"
                        />
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">{method.icon}</span>
                            <div>
                                <h3 className="font-medium text-gray-900">{method.name}</h3>
                                <p className="text-sm text-gray-600">{method.description}</p>
                            </div>
                        </div>
                    </label>
                ))}
            </div>

            {selectedPayment.type === 'stripe' && (
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Card Information</h3>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b6c8a]"></div>
                            <span className="ml-2 text-gray-600">Loading payment form...</span>
                        </div>
                    ) : clientSecret ? (
                        <PaymentElement />
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-gray-600">Loading payment options...</p>
                        </div>
                    )}
                </div>
            )}

            {selectedPayment.type === 'paypal' && (
                <div className="border-t pt-6">
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <span className="text-4xl mb-4 block">🅿️</span>
                        <p className="text-gray-600">You will be redirected to PayPal to complete your payment</p>
                    </div>
                </div>
            )}

            <div className="mt-6">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={formData.saveInfo}
                        onChange={handleCheckboxChange('saveInfo')}
                        className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Save my information for next time</span>
                </label>
            </div>
        </ShopifyCard>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="text-xl font-bold text-gray-900">Checkout Pro</h1>
                        <div className="flex items-center space-x-2">
                            <svg
                                className="h-5 w-5 text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-sm text-gray-600">Secure Checkout</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {renderProgressBar()}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {currentStep === 1 && (
                            <>
                                {renderContactInfo()}
                                {renderShippingAddress()}
                            </>
                        )}

                        {currentStep === 2 && renderShippingMethod()}

                        {currentStep === 3 && (
                            clientSecret ? (
                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                    {renderPaymentMethod()}
                                </Elements>
                            ) : (
                                <ShopifyCard>
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b6c8a] mr-3"></div>
                                        <span className="text-gray-600">Preparing payment options...</span>
                                    </div>
                                </ShopifyCard>
                            )
                        )}

                        {currentStep === 4 && (
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
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
                                    <p className="text-gray-600">Thank you for your purchase. You will receive a confirmation email shortly.</p>
                                </div>
                            </ShopifyCard>
                        )}

                        {/* Navigation Buttons */}
                        {currentStep < 4 && (
                            <div className="flex justify-between">
                                {currentStep > 1 && (
                                    <ShopifyButton
                                        onClick={handlePrevious}
                                        variant="outline"
                                    >
                                        Return to previous step
                                    </ShopifyButton>
                                )}

                                <div className="ml-auto">
                                    {currentStep < 3 && (
                                        <ShopifyButton onClick={handleNext}>
                                            Continue to {currentStep === 1 ? 'shipping' : 'payment'}
                                        </ShopifyButton>
                                    )}

                                    {currentStep === 3 && (
                                        <ShopifyButton
                                            onClick={handlePayment}
                                            disabled={isProcessing || !selectedShipping}
                                            className="min-w-[200px]"
                                        >
                                            {isProcessing ? 'Processing...' : `Pay $${orderSummary.total.toFixed(2)}`}
                                        </ShopifyButton>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cart Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <ShopifyCartSummary
                            items={cart.items}
                            selectedShipping={selectedShipping}
                            orderSummary={orderSummary}
                            onQuantityChange={handleQuantityChange}
                            onRemoveItem={handleRemoveItem}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ShopifyEnhancedCheckout() {
    return <CheckoutForm />;
}