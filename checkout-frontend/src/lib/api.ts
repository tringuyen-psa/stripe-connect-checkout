const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:29000/api';

// Validate API URL in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  if (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    console.error('❌ Production Error: NEXT_PUBLIC_API_URL is not properly configured for production');
    // Don't crash the app, but show a warning
    console.warn('Please configure NEXT_PUBLIC_API_URL in your production environment');
  }
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}


class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // For development: Mock express checkout payment when backend is not running
      if (endpoint.includes('express-checkout') && API_BASE_URL.includes('localhost:29000')) {
        console.warn('🔄 Using mock payment data for development (backend not running)');

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
          data: {
            clientSecret: 'pi_mock_client_secret_for_development_testing_' + Date.now(),
            availablePaymentMethods: ['applePay', 'googlePay', 'link']
          } as T
        };
      }

      // Check if API is accessible in production
      if (process.env.NODE_ENV === 'production' && API_BASE_URL.includes('localhost')) {
        return {
          error: 'Backend API not configured for production. Please set NEXT_PUBLIC_API_URL environment variable.'
        };
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      // Provide better error messages for common issues
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return {
          error: 'Unable to connect to payment service. Please check your internet connection and try again.'
        };
      }

      return {
        error: errorMessage,
      };
    }
  }

  // Product APIs
  async createProduct(product: {
    name: string;
    price: number;
    quantity: number;
  }) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async getProducts() {
    return this.request('/products');
  }

  async updateProduct(id: string, updates: Partial<{
    name: string;
    price: number;
    quantity: number;
  }>) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Order APIs
  async createOrder(orderData: {
    paymentIntentId: string;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
    customer: {
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      address: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
    };
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    currency?: string;
    paymentMethodId?: string;
    isExpressCheckout?: boolean;
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async getOrderByPaymentIntentId(paymentIntentId: string) {
    return this.request(`/orders/payment-intent/${paymentIntentId}`);
  }

  async getOrders() {
    return this.request('/orders');
  }

  async getOrdersByEmail(email: string) {
    return this.request(`/orders/customer/${encodeURIComponent(email)}`);
  }

  async confirmOrder(id: string) {
    return this.request(`/orders/${id}/confirm`, {
      method: 'POST',
    });
  }

  // Payment APIs
  async createPaymentIntent(paymentData: {
    amount: number;
    currency: string;
    customerEmail: string;
    paymentMethodId?: string;
    stripeAccountId?: string;
  }) {
    return this.request('/payments/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async confirmPayment(paymentIntentId: string) {
    return this.request(`/payments/confirm/${paymentIntentId}`);
  }

  async createPaymentMethod(paymentMethodData: {
    type: string;
    card: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    };
    billing_details?: {
      name: string;
      email: string;
      address?: {
        line1: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    };
  }) {
    return this.request('/payments/create-payment-method', {
      method: 'POST',
      body: JSON.stringify(paymentMethodData),
    });
  }

  async confirmCardPayment(confirmPaymentData: {
    paymentMethodId: string;
    paymentIntentId: string;
  }) {
    return this.request('/payments/confirm-payment', {
      method: 'POST',
      body: JSON.stringify(confirmPaymentData),
    });
  }

  async createExpressCheckoutPayment(expressPaymentData: {
    amount: number;
    currency: string;
    customerEmail: string;
    paymentMethod?: 'apple-pay' | 'google-pay' | 'link' | 'klarna' | 'amazon-pay' | 'afterpay-clearpay' | 'cashapp' | 'alipay' | 'wechat-pay';
    stripeAccountId?: string;
    countryCode?: string;
    customerInfo?: {
      name: string;
      email: string;
      address?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    };
  }) {
    return this.request('/payments/express-checkout', {
      method: 'POST',
      body: JSON.stringify(expressPaymentData),
    });
  }

  async validateAddressAndGetPaymentMethods(addressData: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  }, amount?: number) {
    return this.request('/payments/validate-address', {
      method: 'POST',
      body: JSON.stringify({
        ...addressData,
        amount: amount || 100
      }),
    });
  }
}

export const apiClient = new ApiClient();