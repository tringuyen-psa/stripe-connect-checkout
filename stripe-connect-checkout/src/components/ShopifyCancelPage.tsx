'use client';

export default function ShopifyCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className="h-5 w-5 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm text-gray-600">Payment Cancelled</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <svg
              className="h-8 w-8 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 mb-8">
            Your payment has been cancelled. No charges were made to your account. You can try again if you wish.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#5b6c8a] hover:bg-[#4a5973] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5b6c8a]"
            >
              Return to Checkout
            </button>
            <button
              onClick={() => window.close()}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5b6c8a]"
            >
              Close Window
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
            <p className="text-xs text-gray-600">
              If you encountered any issues during checkout, please contact our customer support team for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}