"use client"

import { CheckoutPage } from "@/components/checkout-page"
import { StripeWrapper } from "@/components/stripe-wrapper"
import { CacheStatus } from "@/components/cache-status"
import { useState } from "react"
import { apiClient } from "@/lib/api"
import { useProducts } from "@/context/ProductContext"
import { StripeCache } from "@/lib/stripe-cache"

export default function Checkout() {
    const { getTotal, products } = useProducts()
    const [clientSecret, setClientSecret] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [shouldCreatePaymentIntent, setShouldCreatePaymentIntent] = useState(false)

    // Only create payment intent when user triggers payment (not on page load)
    const createPaymentIntent = async () => {
        if (products.length === 0 || getTotal() <= 0) {
            return
        }

        setShouldCreatePaymentIntent(true)

        // Clear expired cache entries first
        StripeCache.clearExpiredCache()

        // Generate cache key based on cart contents
        const cacheKey = StripeCache.generateCacheKey(products, getTotal())

        // Check cache first
        const cachedSecret = StripeCache.getCachedClientSecret(cacheKey)
        if (cachedSecret) {
            setClientSecret(cachedSecret)
            setIsLoading(false)
            return
        }

        // No valid cache, create new payment intent
        setIsLoading(true)
        setError(null)
        try {
            console.log('🔄 Creating Express Checkout payment intent (user initiated)')
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
                const newClientSecret = responseData.clientSecret

                setClientSecret(newClientSecret)

                // Cache the clientSecret for future use
                StripeCache.setCachedClientSecret(cacheKey, newClientSecret, getTotal())

                // Log cache statistics
                const stats = StripeCache.getCacheStats()
                console.log('📊 Cache stats:', stats)

                console.log('✅ Payment intent created and cached:', {
                    clientSecret: newClientSecret?.substring(0, 20) + '...',
                    availablePaymentMethods: responseData.availablePaymentMethods?.length || 0,
                    backendResponseTime: responseData.responseTime,
                    totalLoadTime: loadTime,
                    cacheKey: cacheKey.substring(0, 50) + '...'
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

    // Show initial state - no Stripe Elements loaded yet
    if (!shouldCreatePaymentIntent && !clientSecret) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

                        {/* Cart Summary */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                            {products.length === 0 ? (
                                <p className="text-gray-500">Your cart is empty</p>
                            ) : (
                                <div className="space-y-2">
                                    {products.map((product) => (
                                        <div key={product.id} className="flex justify-between">
                                            <span>{product.name} x {product.quantity}</span>
                                            <span>${(product.price * product.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="border-t pt-2 mt-4">
                                        <div className="flex justify-between font-semibold">
                                            <span>Total</span>
                                            <span>${getTotal().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Setup Button */}
                        {products.length > 0 && getTotal() > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold mb-4">Payment</h2>
                                <p className="text-gray-600 mb-4">
                                    Click below to load payment options. No payment will be charged at this step.
                                </p>
                                <button
                                    onClick={createPaymentIntent}
                                    disabled={isLoading}
                                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Loading payment options...</span>
                                        </div>
                                    ) : (
                                        'Load Payment Options'
                                    )}
                                </button>
                            </div>
                        )}

                        <CacheStatus />
                    </div>
                </div>
            </div>
        )
    }

    // Loading state while creating payment intent
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

    // Error state
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
                        onClick={createPaymentIntent}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mr-2"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => {
                            setShouldCreatePaymentIntent(false)
                            setError(null)
                            setClientSecret('')
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Back to Cart
                    </button>
                </div>
            </div>
        )
    }

    // Payment form with Stripe Elements loaded
    return (
        <>
            <StripeWrapper clientSecret={clientSecret} amount={getTotal()} currency="usd">
                <CheckoutPage clientSecret={clientSecret} />
            </StripeWrapper>
            <CacheStatus />
        </>
    )
}