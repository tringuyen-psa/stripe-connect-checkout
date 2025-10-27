"use client"

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { useStripe } from "@stripe/react-stripe-js"

interface PayPalPaymentButtonProps {
    clientSecret?: string
    onSuccess?: (paymentIntentId: string) => void
    onError?: (error: string) => void
    disabled?: boolean
    amount?: number
    currency?: string
    customerEmail?: string
}

export function PayPalPaymentButton({
    clientSecret,
    onSuccess,
    onError,
    disabled = false,
    amount = 0,
    currency = "usd",
    customerEmail
}: PayPalPaymentButtonProps) {
    const stripe = useStripe()
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Initialize PayPal button
    useEffect(() => {
        if (!clientSecret) return

        const timer = setTimeout(() => {
            // Simulate PayPal SDK loading
            renderPayPalButton()
        }, 100)

        return () => clearTimeout(timer)
    }, [clientSecret])

    const renderPayPalButton = () => {
        const container = document.getElementById('paypal-button-container')
        if (!container) return

        // Clear existing content
        container.innerHTML = ''

        // Create a PayPal button using a simple button approach
        // In production, you would integrate with the actual PayPal SDK
        const button = document.createElement('button')
        button.className = 'w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors'
        button.innerHTML = `
            <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
                <text x="0" y="18" fontSize="16" fontWeight="bold" fill="white">PayPal</text>
            </svg>
            <span>Pay with PayPal</span>
        `
        button.onclick = handlePayPalPayment
        container.appendChild(button)
    }

    const handlePayPalPayment = async () => {
        if (!stripe || !clientSecret) {
            onError?.('Stripe is not initialized or client secret is missing')
            return
        }

        setIsProcessing(true)
        setError(null)

        try {
            // For demonstration, we'll simulate a successful PayPal payment
            // In production, you would integrate with Stripe's Payment Element for PayPal
            // or use PayPal's direct SDK integration

            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Generate a mock payment intent ID for demonstration
            const mockPaymentIntentId = `pi_paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            onSuccess?.(mockPaymentIntentId)

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'PayPal payment failed'
            setError(errorMessage)
            onError?.(errorMessage)
        } finally {
            setIsProcessing(false)
        }
    }

    // Simple PayPal button implementation
    // In production, you would use the official PayPal JavaScript SDK
    return (
        <div className="w-full">
            {isProcessing && (
                <div className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-medium py-3 px-4 rounded-lg">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing PayPal payment...
                </div>
            )}
            <div id="paypal-button-container" className="w-full" />

            {error && (
                <div className="mt-2 text-sm text-red-600">
                    {error}
                </div>
            )}

            <p className="mt-2 text-xs text-gray-500 text-center">
                Click the PayPal button above to complete your payment securely.
            </p>
        </div>
    )
}