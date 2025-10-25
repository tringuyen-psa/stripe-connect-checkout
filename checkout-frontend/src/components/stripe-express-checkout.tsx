"use client"

import { useState, useEffect } from "react"
import { useStripe, useElements, ExpressCheckoutElement } from '@stripe/react-stripe-js'
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { useProducts } from "@/context/ProductContext"

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
        paymentMethods: {
          paypal: 'auto',
          link: 'auto',
          applePay: 'auto',
          googlePay: 'auto'
        }
      })

      if (testCountry) {
        console.log(`🌍 Regional Testing Enabled for ${testCountry}:`, {
          expectedPaymentMethods: getExpectedPaymentMethods(testCountry),
          localPaymentMethods: getLocalPaymentMethods(testCountry)
        })
      }
    }
  }, [stripe, elements, clientSecret, testCountry, customerInfo.address.country])

  // Get expected payment methods for test country (PayPal now enabled)
  const getExpectedPaymentMethods = (countryCode: string): string[] => {
    const paymentMap: Record<string, string[]> = {
      'US': ['PayPal', 'Link', 'Apple Pay', 'Google Pay'],
      'GB': ['PayPal', 'Link', 'Apple Pay', 'Google Pay'],
      'DE': ['PayPal', 'Link', 'Klarna', 'Apple Pay'],
      'FR': ['PayPal', 'Link', 'Klarna', 'Apple Pay'],
      'NL': ['PayPal', 'Link', 'Klarna', 'Apple Pay'],
      'CA': ['PayPal', 'Link', 'Apple Pay', 'Google Pay'],
      'AU': ['PayPal', 'Link', 'Apple Pay', 'Google Pay'],
      'JP': ['PayPal', 'Link', 'Apple Pay'],
      'SG': ['PayPal', 'Link', 'Apple Pay', 'Google Pay'],
      'BR': ['PayPal', 'Link'],
      'MX': ['PayPal', 'Link', 'Apple Pay'],
      'IN': ['PayPal', 'Link']
    }
    return paymentMap[countryCode] || ['PayPal', 'Link']
  }

  // Get local payment methods that should be available (PayPal now enabled)
  const getLocalPaymentMethods = (countryCode: string): string[] => {
    // This is a simplified mapping - actual availability depends on Stripe
    const localMap: Record<string, string[]> = {
      'US': ['PayPal', 'Link', 'Apple Pay', 'Google Pay'],
      'GB': ['PayPal', 'Link', 'Apple Pay', 'Google Pay'],
      'DE': ['PayPal', 'Link', 'Klarna', 'Apple Pay'],
      'FR': ['PayPal', 'Link', 'Klarna', 'Apple Pay'],
      'NL': ['PayPal', 'Link', 'Klarna', 'Apple Pay'],
      'CA': ['PayPal', 'Link', 'Apple Pay', 'Google Pay'],
      'AU': ['PayPal', 'Link', 'Apple Pay', 'Google Pay'],
      'JP': ['PayPal', 'Link', 'Apple Pay'],
      'SG': ['PayPal', 'Link', 'Apple Pay', 'Google Pay'],
      'BR': ['PayPal', 'Link'],
      'MX': ['PayPal', 'Link', 'Apple Pay'],
      'IN': ['PayPal', 'Link']
    }
    return localMap[countryCode] || ['PayPal', 'Link']
  }

  const handleConfirm = async (event: any) => {
    if (!stripe || !elements) {
      onError('Payment system not ready')
      return
    }

    setLoading(true)

    try {
      // Use stripe.confirmPayment according to migration guide
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
          payment_method_data: {
            billing_details: {
              name: customerInfo.name,
              email: customerEmail,
              address: {
                line1: customerInfo.address.line1,
                line2: customerInfo.address.line2 || undefined,
                city: customerInfo.address.city,
                state: customerInfo.address.state,
                postal_code: customerInfo.address.postal_code,
                country: customerInfo.address.country,
              },
            },
          },
        },
        redirect: 'if_required', // Only redirect for payment methods that require it
      })

      if (error) {
        console.error('Stripe confirmation error:', error)
        onError(error.message || 'Payment failed')
        return
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

      {clientSecret ? (
        <ExpressCheckoutElement
          options={{
            layout: {
              maxColumns: 3,
              maxRows: 2,
              overflow: 'auto',
            },
            buttonHeight: 48,
            paymentMethods: {
              applePay: 'auto',
              googlePay: 'auto',
              link: 'auto',
              paypal: 'auto', // Enabled - PayPal is now activated
            },
            buttonTheme: {
              paypal: 'gold',
            },
            buttonType: {
              paypal: 'checkout',
            },
            emailRequired: true,
          }}
          onConfirm={handleConfirm}
          onCancel={() => {
            console.log('Payment cancelled by user')
            // Optionally show a message or log the cancellation
          }}
          onLoadError={(error) => {
            console.error('Express Checkout load error:', error)
            onError('Failed to load payment options. Please refresh the page.')
          }}
          onReady={({ availablePaymentMethods }) => {
            console.log('Express Checkout ready with methods:', availablePaymentMethods)
            // According to migration guide, check available payment methods
            if (!availablePaymentMethods || Object.keys(availablePaymentMethods).length === 0) {
              console.warn('No payment methods available. Check Stripe Dashboard configuration.')
              onError('No payment methods are currently available. Please contact support.')
            } else {
              console.log('Available payment methods:', Object.keys(availablePaymentMethods))
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