'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ShopifyCard from './ShopifyCard';
import ShopifyButton from './ShopifyButton';
import ShopifyInput from './ShopifyInput';
import ShopifyProgressBar from './ShopifyProgressBar';
import { Product } from '@/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST!);

interface ShopifyCheckoutPageProps {
    product: Product;
    sessionId: string;
}

function CheckoutForm({ product, sessionId }: { product: Product; sessionId: string }) {
    const stripe = useStripe();
    const elements = useElements();

    const [currentStep, setCurrentStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [complete, setComplete] = useState(false);

    const [shippingInfo, setShippingInfo] = useState({
        email: '',
        name: '',
        phone: '',
        address: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'US',
        },
    });

    const steps = ['Contact', 'Shipping', 'Payment'];

    const calculateTotals = () => {
        const subtotal = product.price;
        const shipping = 0; // Free shipping
        const tax = subtotal * 0.08; // 8% tax
        return {
            subtotal,
            shipping,
            tax,
            total: subtotal + shipping + tax,
        };
    };

    const totals = calculateTotals();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id=${sessionId}`,
                },
            });

            if (error) {
                setMessage(error.message || 'Payment failed');
            } else {
                setComplete(true);
            }
        } catch {
            setMessage('An unexpected error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    if (complete) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <ShopifyCard>
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                                <svg
                                    className="h-8 w-8 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Order Confirmed!
                            </h1>
                            <p className="text-gray-600 mb-4">
                                Thank you for your purchase. Your order has been successfully processed.
                            </p>
                            <ShopifyButton
                                onClick={() => window.close()}
                                className="w-full"
                            >
                                Close Window
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
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Checkout Pro</h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg
                                className="h-5 w-5 text-gray-400"
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
            </header>

            {/* Progress Bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-2xl mx-auto px-4 py-6">
                    <ShopifyProgressBar
                        steps={steps}
                        currentStep={currentStep}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2">
                        <ShopifyCard>
                            <form onSubmit={handleSubmit}>
                                {/* Step 1: Contact Information */}
                                <div className={currentStep === 1 ? 'block' : 'hidden'}>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h2>

                                    <div className="space-y-4">
                                        <ShopifyInput
                                            id="email"
                                            label="Email"
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={shippingInfo.email}
                                            onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                                            required
                                        />

                                        <ShopifyInput
                                            id="name"
                                            label="Full Name"
                                            placeholder="Enter your full name"
                                            value={shippingInfo.name}
                                            onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                                            required
                                        />

                                        <ShopifyInput
                                            id="phone"
                                            label="Phone Number"
                                            type="tel"
                                            placeholder="+1 (555) 123-4567"
                                            value={shippingInfo.phone}
                                            onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                                        />
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                        <ShopifyButton
                                            type="button"
                                            onClick={() => setCurrentStep(2)}
                                            disabled={!shippingInfo.email || !shippingInfo.name}
                                        >
                                            Continue to Shipping
                                        </ShopifyButton>
                                    </div>
                                </div>

                                {/* Step 2: Shipping Information */}
                                <div className={currentStep === 2 ? 'block' : 'hidden'}>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipping Address</h2>

                                    <div className="space-y-4">
                                        <ShopifyInput
                                            id="address-line1"
                                            label="Street Address"
                                            placeholder="123 Main Street"
                                            value={shippingInfo.address.line1}
                                            onChange={(e) => setShippingInfo({
                                                ...shippingInfo,
                                                address: { ...shippingInfo.address, line1: e.target.value }
                                            })}
                                            required
                                        />

                                        <ShopifyInput
                                            id="address-line2"
                                            label="Apartment, suite, etc. (Optional)"
                                            placeholder="Apt 4B"
                                            value={shippingInfo.address.line2}
                                            onChange={(e) => setShippingInfo({
                                                ...shippingInfo,
                                                address: { ...shippingInfo.address, line2: e.target.value }
                                            })}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <ShopifyInput
                                                id="city"
                                                label="City"
                                                placeholder="New York"
                                                value={shippingInfo.address.city}
                                                onChange={(e) => setShippingInfo({
                                                    ...shippingInfo,
                                                    address: { ...shippingInfo.address, city: e.target.value }
                                                })}
                                                required
                                            />

                                            <ShopifyInput
                                                id="state"
                                                label="State"
                                                placeholder="NY"
                                                value={shippingInfo.address.state}
                                                onChange={(e) => setShippingInfo({
                                                    ...shippingInfo,
                                                    address: { ...shippingInfo.address, state: e.target.value }
                                                })}
                                                required
                                            />

                                            <ShopifyInput
                                                id="postalCode"
                                                label="ZIP Code"
                                                placeholder="10001"
                                                value={shippingInfo.address.postalCode}
                                                onChange={(e) => setShippingInfo({
                                                    ...shippingInfo,
                                                    address: { ...shippingInfo.address, postalCode: e.target.value }
                                                })}
                                                required
                                            />
                                        </div>

                                        <ShopifyInput
                                            id="country"
                                            label="Country"
                                            value={shippingInfo.address.country}
                                            onChange={(e) => setShippingInfo({
                                                ...shippingInfo,
                                                address: { ...shippingInfo.address, country: e.target.value }
                                            })}
                                            required
                                        >
                                            <select className="w-full h-full bg-transparent">
                                                <option value="US">United States</option>
                                                <option value="CA">Canada</option>
                                                <option value="GB">United Kingdom</option>
                                                <option value="AU">Australia</option>
                                                <option value="DE">Germany</option>
                                                <option value="FR">France</option>
                                            </select>
                                        </ShopifyInput>
                                    </div>

                                    <div className="mt-8 flex justify-between">
                                        <ShopifyButton
                                            type="button"
                                            variant="outline"
                                            onClick={() => setCurrentStep(1)}
                                        >
                                            Return to Contact
                                        </ShopifyButton>
                                        <ShopifyButton
                                            type="button"
                                            onClick={() => setCurrentStep(3)}
                                            disabled={!shippingInfo.address.line1 || !shippingInfo.address.city || !shippingInfo.address.postalCode}
                                        >
                                            Continue to Payment
                                        </ShopifyButton>
                                    </div>
                                </div>

                                {/* Step 3: Payment */}
                                <div className={currentStep === 3 ? 'block' : 'hidden'}>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Information</h2>

                                    <div className="space-y-6">
                                        <PaymentElement />

                                        {message && (
                                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                                <p className="text-sm text-red-800">{message}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 flex justify-between">
                                        <ShopifyButton
                                            type="button"
                                            variant="outline"
                                            onClick={() => setCurrentStep(2)}
                                        >
                                            Return to Shipping
                                        </ShopifyButton>
                                        <ShopifyButton
                                            type="submit"
                                            loading={isProcessing}
                                            disabled={isProcessing || !stripe || !elements}
                                        >
                                            {isProcessing ? 'Processing...' : `Pay $${totals.total.toFixed(2)}`}
                                        </ShopifyButton>
                                    </div>
                                </div>
                            </form>
                        </ShopifyCard>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="lg:sticky lg:top-8">
                            <ShopifyCard>
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

                                {/* Product */}
                                <div className="flex items-start space-x-4 mb-6 pb-6 border-b border-gray-200">
                                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                                        <svg
                                            className="w-8 h-8 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-medium text-gray-900 truncate">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">Quantity: 1</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                            ${product.price.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-gray-900">${totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="text-gray-900">
                                            {totals.shipping === 0 ? 'Free' : `$${totals.shipping.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tax</span>
                                        <span className="text-gray-900">${totals.tax.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold text-gray-900">Total</span>
                                        <span className="text-lg font-semibold text-gray-900">
                                            ${totals.total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Trust Badges */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex items-center justify-center text-sm text-gray-500">
                                        <svg
                                            className="w-4 h-4 mr-2 text-green-600"
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
                                        Secure payments powered by Stripe
                                    </div>
                                </div>
                            </ShopifyCard>

                            {/* Support */}
                            <ShopifyCard className="mt-4">
                                <div className="text-center">
                                    <svg
                                        className="w-8 h-8 mx-auto text-gray-400 mb-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <h3 className="text-sm font-medium text-gray-900 mb-1">Need Help?</h3>
                                    <p className="text-xs text-gray-600">
                                        Contact our support team for assistance
                                    </p>
                                </div>
                            </ShopifyCard>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ShopifyCheckoutPage({ product, sessionId }: ShopifyCheckoutPageProps) {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm product={product} sessionId={sessionId} />
        </Elements>
    );
}