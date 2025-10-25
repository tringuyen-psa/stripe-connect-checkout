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

    // Simple payment intent creation for Express Checkout
    useEffect(() => {
        const createPaymentIntent = async () => {
            if (products.length === 0 || getTotal() <= 0) {
                return
            }

            setIsLoading(true)
            try {
                console.log('🔄 Creating Express Checkout payment intent')

                const response = await apiClient.createExpressCheckoutPayment({
                    amount: getTotal(),
                    currency: 'usd',
                    customerEmail: 'customer@example.com',
                    // stripeAccountId: process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID, // Disabled: Cannot transfer to your own account
                })

                if (response.data && !response.error) {
                    setClientSecret((response.data as any).clientSecret)
                    console.log('✅ Payment intent created:', {
                        clientSecret: (response.data as any).clientSecret?.substring(0, 20) + '...',
                        paymentMethods: (response.data as any).paymentMethods
                    })
                } else if (response.error) {
                    console.error('Payment intent creation failed:', response.error)
                }
            } catch (error) {
                console.error('Failed to create payment intent:', error)
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
                    <p className="text-gray-600">Setting up payment options...</p>
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