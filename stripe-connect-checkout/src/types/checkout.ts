export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  addedAt?: string; // ISO string to avoid hydration issues
  currency?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  currency: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  description: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'stripe' | 'paypal';
  icon: string;
  description: string;
}

export interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  country: string;
  postalCode: string;
  phone?: string;
  shippingMethod: string;
  paymentMethod: string;
  saveInfo: boolean;
}

export interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}