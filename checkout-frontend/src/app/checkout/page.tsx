"use client"

import { CheckoutPage } from "@/components/checkout-page"
import { StripeWrapper } from "@/components/stripe-wrapper"
import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { useProducts } from "@/context/ProductContext"

export default function Checkout() {
    const { getTotal, products } = useProducts()
    const [clientSecret, setClientSecret] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Simple payment intent creation for Express Checkout with caching
    useEffect(() => {
        const createPaymentIntent = async () => {
            if (products.length === 0 || getTotal() <= 0) {
                return
            }

            setIsLoading(true)
            setError(null)
            try {
                console.log('🔄 Creating Express Checkout payment intent')
                const startTime = Date.now()

                const response = await apiClient.createExpressCheckoutPayment({
                    amount: getTotal() * 100, // Convert to cents for Stripe
                    currency: 'usd',
                    customerEmail: 'customer@example.com',
                    stripeAccountId: process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID, // Disabled: Cannot transfer to your own account
                })

                const loadTime = Date.now() - startTime
                console.log(`⚡ Express Checkout API response time: ${loadTime}ms`)

                if (response.data && !response.error) {
                    const responseData = response.data as any
                    setClientSecret(responseData.clientSecret)
                    console.log('✅ Payment intent created:', {
                        clientSecret: responseData.clientSecret?.substring(0, 20) + '...',
                        availablePaymentMethods: responseData.availablePaymentMethods?.length || 0,
                        backendResponseTime: responseData.responseTime,
                        totalLoadTime: loadTime
                    })
                } else if (response.error) {
                    console.error('Payment intent creation failed:', response.error)
                    setError(response.error)
                }
            } catch (error) {
                console.error('Failed to create payment intent:', error)
                setError(error instanceof Error ? error.message : 'Failed to set up payment options')
            } finally {
                setIsLoading(false)
            }
        }

        createPaymentIntent()
    }, [products, getTotal])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Setting up payment options...</p>
                    <p className="text-xs text-gray-500">Connecting to Stripe to load available payment methods</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="text-red-600 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment Setup Failed</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <StripeWrapper clientSecret={clientSecret} amount={getTotal()} currency="usd">
            <CheckoutPage clientSecret={clientSecret} />
        </StripeWrapper>
    )
}