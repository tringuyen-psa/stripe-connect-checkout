'use client';

import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import ShopifyCard from './ShopifyCard';

interface SubscriptionPaymentFormProps {
  subscriptionId: string;
}

export default function SubscriptionPaymentForm({ subscriptionId }: SubscriptionPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [stripeLoadingError, setStripeLoadingError] = useState(false);

  useEffect(() => {
    // Check if Stripe is loading
    const timer = setTimeout(() => {
      if (!stripe) {
        setStripeLoadingError(true);
        setMessage('Stripe is loading. Please refresh the page and try again.');
      }
    }, 5000); // 5 seconds timeout

    return () => clearTimeout(timer);
  }, [stripe]);

  useEffect(() => {
    if (!stripe) return;

    // Retrieve the subscription status
    const clientSecret = new URLSearchParams(window.location.search).get(
      'client_secret'
    );

    if (!clientSecret) {
      setMessage('Missing payment information. Please start over.');
      return;
    }

    // You can also retrieve the subscription status from your server
    // to handle cases where the payment is already completed
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    console.log('🔍 Processing subscription payment...');
    console.log('📋 Subscription ID:', subscriptionId);

    try {
      // For subscriptions, we need to use confirmPayment for the first payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription-success?subscription_id=${subscriptionId}`,
        },
        // Important: For subscriptions, don't redirect automatically
        redirect: 'if_required',
      });

      if (error) {
        console.error('❌ Payment error:', error);
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(error.message || 'An unexpected error occurred.');
        } else {
          setMessage(`Payment failed: ${error.message}`);
        }
      } else {
        console.log('✅ Payment successful!');
        setMessage('Payment successful! Redirecting...');
        setIsComplete(true);

        // Redirect to success page
        setTimeout(() => {
          window.location.href = `/subscription-success?subscription_id=${subscriptionId}`;
        }, 2000);
      }
    } catch (err) {
      console.error('❌ Unexpected payment error:', err);
      setMessage('An unexpected error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: 'tabs' as const,
  };

  if (isComplete) {
    return (
      <ShopifyCard>
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mb-4">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your subscription has been activated. Redirecting to your dashboard...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b6c8a] mx-auto"></div>
        </div>
      </ShopifyCard>
    );
  }

  // Show loading state while Stripe is initializing
  if (!stripe && !stripeLoadingError) {
    return (
      <ShopifyCard>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b6c8a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment form...</p>
        </div>
      </ShopifyCard>
    );
  }

  return (
    <ShopifyCard>
      <form id="payment-form" onSubmit={handleSubmit}>
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
          {stripe ? (
            <PaymentElement options={paymentElementOptions} />
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Failed to load payment form. Please refresh the page and try again.
              </p>
            </div>
          )}
        </div>

        {/* Security badges */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm text-gray-600">Secured by Stripe</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm text-gray-600">Encrypted Data</span>
            </div>
          </div>
        </div>

        {/* Show error message if any */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes('successful')
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          disabled={isLoading || !stripe || !elements}
          id="submit"
          className="w-full bg-[#5b6c8a] text-white px-6 py-3 rounded-md hover:bg-[#4a5a79] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <span id="button-text">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Complete Subscription Payment'
            )}
          </span>
        </button>

        {/* Subscription info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Note:</strong> By completing this payment, you authorize recurring charges according to your selected billing cycle. You can cancel anytime from your account settings.
          </p>
        </div>
      </form>
    </ShopifyCard>
  );
}