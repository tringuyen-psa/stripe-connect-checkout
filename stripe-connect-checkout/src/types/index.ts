export interface ProductInput {
  name: string;
  price: number;
  currency?: string;
  description?: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
  image?: string;
  createdAt?: Date;
}

export interface CheckoutSession {
  id: string;
  checkoutUrl: string;
  sessionId: string;
  product: Product;
}


export interface Order {
  id: string;
  sessionId: string;
  productId: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingInfo {
  name: string;
  email: string;
  phone?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface CheckoutForm {
  shipping: ShippingInfo;
  paymentMethodId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}