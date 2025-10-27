'use client'

import React, { useState, useEffect } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { apiClient } from '../lib/api'

export default function StripeExpressCheckoutFixed() {
  const stripe = useStripe()
  const elements = useElements()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async (event: any) => {
    if (!stripe || !elements) {
      setError('Payment system not ready')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Submit payment elements
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Payment submission failed')
        return
      }

      // Create order (for demo - in production, this would be called after actual payment confirmation)
      const orderResponse = await apiClient.createOrder({
        paymentIntentId: 'pi_demo_' + Date.now(), // Demo payment intent ID
        items: [
          {
            name: 'Sample Product',
            price: 2999,
            quantity: 1
          }
        ],
        customer: {
          email: 'customer@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          address: '123 Demo St',
          city: 'Demo City',
          country: 'US',
          postalCode: '10001'
        },
        subtotal: 2999,
        tax: 300,
        shipping: 0,
        total: 3299,
        currency: 'usd',
        isExpressCheckout: true,
      })

      if (orderResponse.error) {
        throw new Error(orderResponse.error || 'Failed to create order')
      }

      // Success - redirect to success page
      const orderId = (orderResponse.data as any)?.id
      const params = new URLSearchParams({
        orderId: orderId || 'unknown',
        paymentId: 'pi_demo_' + Date.now(),
        amount: '32.99',
        currency: 'usd',
        status: 'completed',
        email: 'customer@example.com',
        paymentMethod: 'express-checkout'
      })

      window.location.href = '/success?' + params.toString()

    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Processing payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Express Checkout</h2>

        <PaymentElement />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  )
}