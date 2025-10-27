const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:29000/api';

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
      return {
        error: error instanceof Error ? error.message : 'An unknown error occurred',
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
      country: string;
      postalCode: string;
    };
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
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
    paymentMethod?: 'apple-pay' | 'google-pay' | 'paypal' | 'link' | 'klarna' | 'amazon-pay' | 'afterpay-clearpay' | 'cashapp' | 'alipay' | 'wechat-pay';
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