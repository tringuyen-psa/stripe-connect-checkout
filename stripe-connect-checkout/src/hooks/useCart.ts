'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem, Cart } from '@/types/checkout';

export function useCart() {
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    itemCount: 0,
    currency: 'USD'
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load cart from localStorage on mount (client-side only)
  useEffect(() => {
    if (!isClient) return;

    try {
      const savedCart = localStorage.getItem('shopify-cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Validate the cart structure before setting
        if (parsedCart && parsedCart.items && Array.isArray(parsedCart.items)) {
          setCart(parsedCart);
        } else {
          // Clear invalid cart data
          localStorage.removeItem('shopify-cart');
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem('shopify-cart');
      } catch (clearError) {
        console.error('Error clearing localStorage:', clearError);
      }
    }
  }, [isClient]);

  // Save cart to localStorage whenever it changes (client-side only)
  useEffect(() => {
    if (!isClient) return;

    try {
      if (cart.items.length > 0) {
        localStorage.setItem('shopify-cart', JSON.stringify(cart));
      } else {
        localStorage.removeItem('shopify-cart');
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart, isClient]);

  // Calculate totals - moved to separate function to avoid infinite loop
  const calculateTotals = useCallback((items: CartItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, itemCount };
  }, []);

  const addToCart = (product: { id: string; name: string; price: number }) => {
    setCart(prevCart => {
      const existingItem = prevCart.items.find(item => item.id === product.id);

      let updatedItems: CartItem[];

      if (existingItem) {
        // Update quantity if item exists
        updatedItems = prevCart.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          ...product,
          quantity: 1,
          addedAt: isClient ? new Date().toISOString() : '', // Use ISO string instead of Date object
          currency: 'USD'
        };
        updatedItems = [...prevCart.items, newItem];
      }

      const { subtotal, itemCount } = calculateTotals(updatedItems);

      return {
        ...prevCart,
        items: updatedItems,
        subtotal,
        itemCount
      };
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prevCart => {
      const updatedItems = prevCart.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      const { subtotal, itemCount } = calculateTotals(updatedItems);

      return {
        ...prevCart,
        items: updatedItems,
        subtotal,
        itemCount
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const updatedItems = prevCart.items.filter(item => item.id !== itemId);
      const { subtotal, itemCount } = calculateTotals(updatedItems);

      return {
        ...prevCart,
        items: updatedItems,
        subtotal,
        itemCount
      };
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      subtotal: 0,
      itemCount: 0,
      currency: 'USD'
    });
  };

  const getTotalPrice = () => {
    return cart.subtotal; // Use pre-calculated subtotal for consistency
  };

  return {
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice
  };
}