"use client"

import { useState, useEffect } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface StripeElementsProps {
    onSubmit: (paymentMethod: any) => void
    isProcessing: boolean
    error: string | null
}

export function StripeElements({ onSubmit, isProcessing, error }: StripeElementsProps) {
    const stripe = useStripe()
    const elements = useElements()
    const [cardError, setCardError] = useState<string | null>(null)
    const [isComplete, setIsComplete] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!stripe || !elements) {
            setCardError("Stripe hasn't loaded yet. Please try again.")
            return
        }

        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
            setCardError("Card element not found.")
            return
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        })

        if (error) {
            setCardError(error.message || 'Payment failed')
        } else if (paymentMethod) {
            setCardError(null)
            onSubmit(paymentMethod)
        }
    }

    const handleCardChange = (event: any) => {
        setCardError(event.error ? event.error.message : null)
        setIsComplete(event.complete)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card Element */}
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                        hidePostalCode: true
                    }}
                    onChange={handleCardChange}
                />
            </div>

            {/* Card Error Display */}
            {cardError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{cardError}</p>
                    </div>
                </div>
            )}

            {/* General Error Display */}
            {error && !cardError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {/* Submit Button - Hidden since we use the main Place Order button */}
            <button type="submit" disabled={!isComplete || isProcessing} className="hidden">
                Submit Payment
            </button>
        </form>
    )
}