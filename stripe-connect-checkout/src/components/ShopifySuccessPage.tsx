'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ShopifyCard from './ShopifyCard';
import ShopifyButton from './ShopifyButton';

interface OrderDetails {
  id?: string;
  payment_intent?: string;
  payment_status?: string;
  amount_total?: number;
  line_items?: {
    data: Array<{
      description?: string;
      amount_total?: number;
    }>;
  };
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    // Handle payment intent success
    if (paymentIntentId && redirectStatus === 'succeeded') {
      // Get payment amount from sessionStorage BEFORE clearing it
      const paymentAmount = sessionStorage.getItem('payment_amount');
      console.log('Payment amount from sessionStorage:', paymentAmount);

      // Convert to dollars for display
      const amountInCents = paymentAmount ? parseInt(paymentAmount) : 0;
      const amountInDollars = amountInCents / 100;
      console.log('Amount in cents:', amountInCents);
      console.log('Amount in dollars:', amountInDollars);

      // Clear sessionStorage after use
      sessionStorage.removeItem('payment_amount');
      sessionStorage.removeItem('payment_currency');

      // For payment intents, create a basic success response
      setOrderDetails({
        id: paymentIntentId,
        payment_intent: paymentIntentId,
        payment_status: redirectStatus,
        amount_total: amountInCents, // Store in cents
        line_items: {
          data: [
            {
              description: 'Payment completed successfully',
              amount_total: amountInCents, // Store in cents
            }
          ]
        }
      });
      setLoading(false);
      return;
    }

    // Handle checkout session success
    if (sessionId) {
      const fetchOrderDetails = async () => {
        try {
          const response = await fetch(`/api/checkout?session_id=${sessionId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to load order details');
          }

          setOrderDetails(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load order details');
        } finally {
          setLoading(false);
        }
      };

      fetchOrderDetails();
      return;
    }

    // No valid parameters found
    setError('Session ID or Payment Intent is required');
    setLoading(false);
  }, [sessionId, paymentIntentId, redirectStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b6c8a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <ShopifyCard>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
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

  // Handle both payment intents and checkout sessions
  const lineItem = orderDetails?.line_items?.data?.[0];
  const productName = lineItem?.description || 'Product';
  // paymentIntent.amount from sessionStorage is in cents, so convert to dollars
  const amount = orderDetails?.amount_total ? orderDetails.amount_total / 100 : (lineItem?.amount_total || 0) / 100;
  const orderId = orderDetails?.payment_intent || orderDetails?.id || sessionId || 'Unknown';

  console.log('Order details:', orderDetails);
  console.log('Final amount to display:', amount);

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
                className="h-5 w-5 text-green-600"
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
              <span className="text-sm text-gray-600">Order Complete</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <svg
              className="h-10 w-10 text-green-600"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thank You For Your Order!
          </h1>
          <p className="text-lg text-gray-600">
            Your order has been successfully processed and confirmed.
          </p>
        </div>

        {/* Order Details */}
        <ShopifyCard className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Details</h2>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Order Number</span>
              <span className="text-sm font-medium text-gray-900">{orderId}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Product</span>
              <span className="text-sm font-medium text-gray-900">{productName}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Amount Paid</span>
              <span className="text-sm font-medium text-gray-900">${amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-3">
              <span className="text-sm text-gray-600">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed
              </span>
            </div>
          </div>
        </ShopifyCard>

        {/* Next Steps */}
        <ShopifyCard className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What&apos;s Next?</h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-blue-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Confirmation Email</h3>
                <p className="text-sm text-gray-600">A confirmation email has been sent to your registered email address.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-blue-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Order Processing</h3>
                <p className="text-sm text-gray-600">Your order is being processed and will be shipped according to the delivery timeline.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <svg
                className="h-6 w-6 text-blue-600 mt-0.5"
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
              <div>
                <h3 className="text-sm font-medium text-gray-900">Customer Support</h3>
                <p className="text-sm text-gray-600">If you have any questions, please don&apos;t hesitate to contact our support team.</p>
              </div>
            </div>
          </div>
        </ShopifyCard>

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <ShopifyButton
              onClick={() => {
                // Nếu là popup, đóng và mở trang chính mới
                if (window.opener) {
                  window.opener.location.href = '/';
                  window.close();
                } else {
                  window.location.href = '/';
                }
              }}
              variant="outline"
              className="flex-1"
            >
              🛍️ Tiếp tục mua sắm
            </ShopifyButton>
            <ShopifyButton
              onClick={() => {
                // Nếu là popup, chỉ đóng cửa sổ
                if (window.opener) {
                  window.close();
                } else {
                  // Nếu không phải popup, về trang chính
                  window.location.href = '/';
                }
              }}
              className="flex-1"
            >
              🏠 Về trang chính
            </ShopifyButton>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              💡 <strong>Mẹo:</strong> Đóng cửa sổ này để quay lại trang mua sắm
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopifySuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b6c8a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}