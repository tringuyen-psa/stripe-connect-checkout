'use client';
import ShopifyCard from './ShopifyCard';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'stripe' | 'paypal';
  icon: string;
  description: string;
  features: string[];
}

export interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  showCardForm?: boolean;
  children?: React.ReactNode;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    type: 'stripe',
    icon: '💳',
    description: 'Pay with Visa, Mastercard, or American Express',
    features: ['Secure payment', 'Buyer protection', 'Instant confirmation']
  },
  {
    id: 'paypal',
    name: 'PayPal',
    type: 'paypal',
    icon: '🅿️',
    description: 'Pay with your PayPal account',
    features: ['Buyer protection', 'Easy returns', 'Pay later options']
  }
];

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  showCardForm = false,
  children
}: PaymentMethodSelectorProps) {
  return (
    <ShopifyCard>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>

      <div className="space-y-4 mb-6">
        {PAYMENT_METHODS.map((method) => (
          <label
            key={method.id}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedMethod.id === method.id
                ? 'border-[#5b6c8a] bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="radio"
              name="payment"
              value={method.id}
              checked={selectedMethod.id === method.id}
              onChange={() => onMethodChange(method)}
              className="mr-3 h-4 w-4 text-[#5b6c8a] focus:ring-[#5b6c8a] border-gray-300"
            />
            <div className="flex items-center space-x-3 flex-1">
              <span className="text-2xl">{method.icon}</span>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{method.name}</h3>
                <p className="text-sm text-gray-600">{method.description}</p>
                <div className="flex items-center space-x-3 mt-1">
                  {method.features.map((feature, index) => (
                    <span key={index} className="text-xs text-green-600">
                      ✓ {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>

      {showCardForm && selectedMethod.type === 'stripe' && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Card Information</h3>
          {children || (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Payment form will be loaded here</p>
            </div>
          )}
        </div>
      )}

      {showCardForm && selectedMethod.type === 'paypal' && (
        <div className="border-t pt-6">
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <span className="text-4xl mb-4 block">🅿️</span>
            <p className="text-gray-600 mb-4">You will be redirected to PayPal to complete your payment</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Pay with your PayPal account or credit card</p>
              <p>• No additional fees</p>
              <p>• Full buyer protection</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm text-gray-700">Secure 256-bit SSL encryption</span>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-sm text-gray-700">Payment information is protected</span>
        </div>
      </div>
    </ShopifyCard>
  );
}

export { PAYMENT_METHODS };