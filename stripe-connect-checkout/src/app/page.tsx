'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const menuItems = [
  {
    id: 1,
    name: 'Cà Phê Đen',
    price: 3.99,
    description: 'Cà phê đen truyền thống',
    emoji: '☕'
  },
  {
    id: 2,
    name: 'Bạc Xỉu',
    price: 4.99,
    description: 'Bạc xỉu sữa đá',
    emoji: '🥛'
  },
  {
    id: 3,
    name: 'Nâu Đá',
    price: 4.49,
    description: 'Cà phê sữa đá',
    emoji: '🥤'
  },
  {
    id: 4,
    name: 'Cà Phê Muối',
    price: 5.99,
    description: 'Cà phê muối đặc biệt',
    emoji: '🧂'
  },
  {
    id: 5,
    name: 'Latte',
    price: 6.99,
    description: 'Latte nóng',
    emoji: '☕'
  },
  {
    id: 6,
    name: 'Cappuccino',
    price: 6.49,
    description: 'Cappuccino bọt mịn',
    emoji: '☕'
  }
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [email, setEmail] = useState('');

  const addToCart = (itemId: number) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 0) {
        newCart[itemId]--;
        if (newCart[itemId] === 0) {
          delete newCart[itemId];
        }
      }
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find(i => i.id === parseInt(itemId));
      return total + (item?.price || 0) * quantity;
    }, 0);
  };

  const handleCheckout = async () => {
    if (getTotalItems() === 0) {
      alert('Vui lòng chọn món!');
      return;
    }

    if (!email) {
      alert('Vui lòng nhập email!');
      return;
    }

    setLoading(true);

    try {
      const stripe = await stripePromise;

      const checkoutItems = Object.entries(cart).map(([itemId, quantity]) => {
        const item = menuItems.find(i => i.id === parseInt(itemId));
        return {
          name: item?.name,
          price: item?.price,
          quantity: quantity,
          description: item?.description
        };
      });

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment/create-checkout-session`,
        {
          items: checkoutItems,
          customerEmail: email
        }
      );

      const { sessionId } = response.data;

      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (error) {
          console.error('Stripe redirect error:', error);
          alert('Có lỗi xảy ra, vui lòng thử lại!');
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">☕ Quán Cà Phê Nhỏ</h1>
          <p className="text-gray-600">Đặt nước online, nhận tại quầy!</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Menu */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Thực Đơn</h2>
            <div className="grid gap-4">
              {menuItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{item.emoji}</span>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <p className="text-orange-600 font-bold">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {cart[item.id] ? (
                        <>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                          <span className="font-semibold w-8 text-center">{cart[item.id]}</span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="bg-orange-500 hover:bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => addToCart(item.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Thêm
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Giỏ Hàng</h2>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              {getTotalItems() === 0 ? (
                <p className="text-gray-500 text-center py-8">Giỏ hàng trống</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {Object.entries(cart).map(([itemId, quantity]) => {
                      const item = menuItems.find(i => i.id === parseInt(itemId));
                      return (
                        <div key={itemId} className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">{item?.name}</h4>
                            <p className="text-sm text-gray-600">${item?.price.toFixed(2)} x {quantity}</p>
                          </div>
                          <p className="font-semibold">${((item?.price || 0) * quantity).toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Tổng cộng:</span>
                      <span className="text-lg font-bold text-orange-600">${getTotalPrice().toFixed(2)}</span>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email của bạn
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={loading || !email}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      {loading ? 'Đang xử lý...' : 'Thanh toán với Stripe'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
