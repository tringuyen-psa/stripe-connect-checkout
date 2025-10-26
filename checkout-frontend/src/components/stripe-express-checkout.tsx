"use client"

import { useState, useEffect } from "react"
import { useStripe, useElements, ExpressCheckoutElement } from '@stripe/react-stripe-js'
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { useProducts } from "@/context/ProductContext"
import { logStripeError, isExtensionError } from "@/lib/stripe-error-handler"

interface StripeExpressCheckoutProps {
  customerEmail: string
  customerInfo: {
    name: string
    address: {
      line1: string
      line2?: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
  onSuccess: (orderId: string, paymentId: string) => void
  onError: (error: string) => void
  disabled?: boolean
  clientSecret?: string
  testCountry?: string // For regional testing
}

export function StripeExpressCheckout({
  customerEmail,
  customerInfo,
  onSuccess,
  onError,
  disabled = false,
  clientSecret,
  testCountry
}: StripeExpressCheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { getTotal, products } = useProducts()
  const [loading, setLoading] = useState(false)

  // Component now receives clientSecret from parent, no need to create it here
  useEffect(() => {
    // Just log when Stripe is ready
    if (stripe && elements) {
      console.log('Stripe Express Checkout ready')
      console.log('Current configuration:', {
        hasClientSecret: !!clientSecret,
        testCountry: testCountry || 'Not set',
        customerInfoCountry: customerInfo.address.country,
        paymentMethods: 'auto - Stripe will determine available methods based on account activation'
      })

      if (testCountry) {
        console.log(`🌍 Regional Testing Enabled for ${testCountry}:`, {
          expectedPaymentMethods: getExpectedPaymentMethods(),
          localPaymentMethods: getLocalPaymentMethods()
        })
      }
    }
  }, [stripe, elements, clientSecret, testCountry, customerInfo.address.country])

  // Get expected payment methods (all enabled methods)
  const getExpectedPaymentMethods = (): string[] => {
    // All enabled payment methods
    return ['Apple Pay', 'Google Pay', 'PayPal', 'Link', 'Klarna', 'Amazon Pay']
  }

  // Get local payment methods that should be available (all enabled methods)
  const getLocalPaymentMethods = (): string[] => {
    // All enabled payment methods
    return ['Apple Pay', 'Google Pay', 'PayPal', 'Link', 'Klarna', 'Amazon Pay']
  }

  const handleConfirm = async (event: any) => {
    if (!stripe || !elements) {
      onError('Payment system not ready')
      return
    }

    setLoading(true)

    try {
      // First, submit the elements to get the payment method
      const { error: submitError } = await elements.submit()
      if (submitError) {
        onError(submitError.message || 'Payment submission failed')
        return
      }

      // Create payment intent for Express Checkout if we don't have a clientSecret
      if (!clientSecret) {
        const expressPaymentResponse = await apiClient.createExpressCheckoutPayment({
          amount: getTotal(),
          currency: 'usd',
          customerEmail,
          customerInfo: {
            name: customerInfo.name,
            email: customerEmail,
            address: {
              line1: customerInfo.address.line1,
              line2: customerInfo.address.line2,
              city: customerInfo.address.city,
              state: customerInfo.address.state,
              postal_code: customerInfo.address.postal_code,
              country: customerInfo.address.country,
            }
          }
        })

        if (expressPaymentResponse.error || !expressPaymentResponse.data) {
          throw new Error(expressPaymentResponse.error || 'Failed to create express checkout payment')
        }

        // We got a clientSecret, now we can confirm the payment
        const { client_secret } = expressPaymentResponse.data as any

        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret: client_secret,
          confirmParams: {
            return_url: `${window.location.origin}/success`,
          },
          redirect: 'if_required',
        })

        if (error) {
          console.error('Stripe confirmation error:', error)
          onError(error.message || 'Payment failed')
          return
        }
      } else {
        // Use existing clientSecret
        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/success`,
          },
          redirect: 'if_required',
        })

        if (error) {
          console.error('Stripe confirmation error:', error)
          onError(error.message || 'Payment failed')
          return
        }
      }

      // If we get here with no error and no redirect, payment was successful
      // Create order after successful payment
      const orderResponse = await apiClient.createOrder({
        items: products.map(p => ({
          name: p.name,
          price: p.price,
          quantity: p.quantity
        })),
        customer: {
          email: customerEmail,
          firstName: customerInfo.name.split(' ')[0],
          lastName: customerInfo.name.split(' ').slice(1).join(' '),
          phone: '',
          address: customerInfo.address.line1,
          city: customerInfo.address.city,
          country: customerInfo.address.country,
          postalCode: customerInfo.address.postal_code,
        },
        subtotal: getTotal(),
        tax: 0,
        shipping: 0,
        total: getTotal(),
      })

      if (orderResponse.error) {
        throw new Error(orderResponse.error || 'Failed to create order')
      }

      const orderId = (orderResponse.data as any)?.id
      // For successful payments without redirect, we need to get the payment intent ID
      // This will be handled by the success page redirect or webhook
      onSuccess(orderId || 'unknown', 'express-checkout')

    } catch (error) {
      console.error('Express checkout error:', error)
      onError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (!stripe || !elements || products.length === 0 || getTotal() === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        {!stripe || !elements ? 'Loading payment options...' : 'Add items to cart to enable Express Checkout'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Express checkout</p>

      {/* Options Labels */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
            <svg width="8" height="6" viewBox="0 0 8 6" fill="white">
              <path d="M1 3L2.5 4.5L7 0.5" stroke="white" strokeWidth="1" fill="none"/>
            </svg>
          </div>
          <span className="text-sm text-gray-700 font-medium">Buy now</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-700 font-medium">Pay later</span>
        </div>
      </div>

      {clientSecret ? (
        <ExpressCheckoutElement
          options={{
            layout: {
              maxColumns: 3,
              maxRows: 2,
              overflow: 'auto',
            },
            buttonHeight: 48,
            // Configure specific button types for each payment method
            buttonType: {
              applePay: 'buy',
              googlePay: 'buy',
              paypal: 'buynow',
            },
            buttonTheme: {
              paypal: 'gold',
            },
            paymentMethods: {
              applePay: 'always',  // Force Apple Pay to show
              cashapp: 'always',   // Force Cash App to show
              paypal: {
                custom: 'cpmt_1SM0OnGvqAVA71VqxYBxlHt5'  // Custom PayPal payment method
              },
              // Other methods: let Stripe auto-detect
            } as any,
            emailRequired: true,
          }}
          onConfirm={handleConfirm}
          onCancel={() => {
            console.log('Payment cancelled by user')
            // Optionally show a message or log the cancellation
          }}
          onLoadError={(error) => {
            logStripeError(error, 'Express Checkout load error')
            // Filter out browser extension communication errors
            if (error.error && error.error.message && isExtensionError(error.error)) {
              return
            }
            onError('Failed to load payment options. Please refresh the page.')
          }}
          onReady={({ availablePaymentMethods }) => {
            console.log('Express Checkout ready with methods:', availablePaymentMethods)
            // According to migration guide, check available payment methods
            if (!availablePaymentMethods || Object.keys(availablePaymentMethods).length === 0) {
              console.warn('No payment methods available. Check Stripe Dashboard configuration.')
              onError('No payment methods are currently available. Please contact support.')
            } else {
              // Filter for payment methods that are actually available (true value)
              const enabledMethods = Object.entries(availablePaymentMethods)
                .filter(([_, isAvailable]) => isAvailable === true)
                .map(([method]) => method)

              console.log('✅ Available payment methods:', enabledMethods)

              // Log which payment methods fall into which category
              const buyNowMethods = ['applePay', 'googlePay', 'paypal', 'amazonPay', 'link', 'cashapp']
              const payLaterMethods = ['klarna', 'afterpay', 'affirm', 'clearpay']

              const availableBuyNow = enabledMethods.filter(method =>
                buyNowMethods.includes(method)
              )
              const availablePayLater = enabledMethods.filter(method =>
                payLaterMethods.includes(method)
              )

              console.log('💳 Buy now methods:', availableBuyNow)
              console.log('📅 Pay later methods:', availablePayLater)

              // Detailed status for each payment method
              console.log('📊 Payment Method Status:')
              Object.entries(availablePaymentMethods).forEach(([method, isAvailable]) => {
                const status = isAvailable ? '✅ Available' : '❌ Unavailable'
                const category = buyNowMethods.includes(method) ? '💳' :
                               payLaterMethods.includes(method) ? '📅' : '❓'
                console.log(`${category} ${method}: ${status}`)
              })

              // Development environment notes
              console.log('📝 Development Notes:')
              if (window.location.protocol === 'http:') {
                console.log('⚠️  Running on HTTP - Google Pay and Apple Pay require HTTPS')
              }
              if (!enabledMethods.includes('applePay') && availablePaymentMethods.applePay === false) {
                console.log('🍎 Apple Pay: ❌ Not available (domain verification may be needed)')
              }
              if (!enabledMethods.includes('googlePay') && availablePaymentMethods.googlePay === false) {
                console.log('🔍 Google Pay: ❌ Not available (requires HTTPS environment)')
              }
              if (enabledMethods.includes('amazonPay')) {
                console.log('🛒 Amazon Pay: ✅ Available and ready')
              }
              if (enabledMethods.includes('link')) {
                console.log('🔗 Link: ✅ Available (Stripe\'s native payment method)')
              }
              if (enabledMethods.includes('cashapp')) {
                console.log('💰 Cash App: ✅ Available and ready')
              }
              if (enabledMethods.includes('paypal')) {
                console.log('🅿️ PayPal (Custom): ✅ Available with custom payment method cpmt_1SM0OnGvqAVA71VqxYBxlHt5')
              }
            }
          }}
          onShippingAddressChange={(event) => {
            // Handle shipping address changes if needed
            console.log('Shipping address changed:', event)
          }}
          onShippingRateChange={(event) => {
            // Handle shipping rate changes if needed
            console.log('Shipping rate changed:', event)
          }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button disabled className="h-12 opacity-50">
            <div className="w-4 h-4 bg-gray-300 rounded animate-pulse mx-auto" />
          </Button>
          <Button disabled className="h-12 opacity-50">
            <div className="w-4 h-4 bg-gray-300 rounded animate-pulse mx-auto" />
          </Button>
        </div>
      )}
    </div>
  )
}